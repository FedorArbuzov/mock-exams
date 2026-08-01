# 01. Patroni and automatic failover

## Real-world scenario

The primary went down at 02:14. The on-call engineer manually runs `pg_promote()` on the "freshest" replica — but the second replica also received a promote from another admin. Two primaries, split-brain, orders written into different universes. An hour later — manual data merge and a postmortem.

**Patroni** + **DCS** (etcd/Consul) solve this: who is the single leader, automatic failover, health checks. This is the next step after manual streaming replication ([intermediate/05-streaming-replication](../postgresql-intermediate/05-streaming-replication.md)).

## What you'll learn

- Why manual promote is dangerous
- The Patroni + DCS + HAProxy architecture
- Sync vs async replication in HA
- Alternatives: pg_auto_failover, managed RDS Multi-AZ

## The problem with manual failover

| Question | Without an orchestrator |
|--------|------------------|
| Who promotes? | A human under stress |
| Which replica is fresher? | Manual LSN comparison |
| Two primaries? | Split-brain is possible |
| When to switch DNS? | Not coordinated with the app |

A streaming replica ([intermediate/06](../postgresql-intermediate/06-lab-streaming-replication.md)) gives you a copy of the data; **Patroni** gives you a **process** for electing a leader.

## Patroni architecture

```text
              etcd / Consul (DCS — quorum 3+ nodes)
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
       Node AZ-a     Node AZ-b     Node AZ-c
       Patroni       Patroni       Patroni
       PostgreSQL    PostgreSQL    PostgreSQL
       (leader)      (replica)     (replica)
          │             │             │
          └─────────────┴─────────────┘
                        │
                   HAProxy / VIP
                   (single write endpoint)
                        │
                     App pods
```

| Component | Role |
|-----------|------|
| **DCS** | Distributed lock for "who is leader"; etcd needs a **quorum** (3, 5 nodes — not 2) |
| **Patroni** | Manages Postgres: start/stop, replicate config, failover |
| **PostgreSQL** | Data; leader read/write, replicas hot standby |
| **HAProxy** | Routing: writes → leader, reads → replicas (optional) |

The leader holds the lock in DCS. Patroni on a replica sees: leader dead → acquire lock → `pg_promote()` → update endpoint.

A typical failover: **30–60 sec** (tunable: `ttl`, `loop_wait`, health checks).

## Split-brain — how Patroni reduces the risk

Split-brain: two nodes consider themselves primary. Patroni:

1. Only one lock holder in DCS.
2. The old leader loses the lock via TTL during a partition.
3. `nofailover`, `noloadbalance` tags for maintenance nodes.

**Not a silver bullet:** if the DCS quorum is lost, the cluster won't elect a leader — read-only is better than two primaries.

## HAProxy / VIP / DNS

The application should **not** store the primary's IP in a ConfigMap forever.

| Approach | Pro | Con |
|--------|------|-------|
| HAProxy + health check | Fast switchover | One more layer |
| Virtual IP (keepalived) | Transparent IP | Harder in the cloud |
| DNS TTL 30–60s | Simple | Delay during failover |
| K8s Service (CNPG) | Native in K8s | Tied to the platform |

PgBouncer ([intermediate/15-pgbouncer](../postgresql-intermediate/15-pgbouncer.md)) in front of HAProxy — a typical stack.

## Synchronous replication in HA

```sql
synchronous_standby_names = 'FIRST 1 (patroni-node2, patroni-node3)'
```

| | Async | Sync (1 standby) |
|---|-------|------------------|
| RPO when the leader fails | Up to the lag | ~0 |
| Commit latency | Lower | Waits for flush on the replica |
| Risk | Loss of the last tx | Leader waits for a slow replica |

Patroni's `synchronous_mode` coordinates with DCS. For finance — sync; for many SaaS apps — async + an acceptable RPO.

## Alternatives

| Solution | When |
|---------|-------|
| **pg_auto_failover** | Simpler than Patroni, fewer components |
| **RDS Multi-AZ** | AWS managed ([13-cloud-k8s](13-cloud-k8s.md)) |
| **CloudNativePG** | Postgres operator in Kubernetes ([14-lab-cloudnativepg](14-lab-cloudnativepg.md)) |
| **Citus** | Distributed/sharding, not classic HA |

## Common mistakes

1. etcd on 2 nodes — no quorum when one goes down.
2. The app connects directly to the primary's IP — no failover endpoint.
3. A sync replica in another region — commit latency 200ms+.
4. Failover without checking lag — promoting a lagging replica.

## Checklist

- [ ] Why DCS (a lock, not just "storing config")
- [ ] Split-brain and the role of TTL
- [ ] HAProxy vs direct to primary
- [ ] Sync replication tradeoff (RPO vs latency)
- [ ] etcd quorum — why not 2 nodes

## Next

Architecture lab: [02-lab-patroni.md](02-lab-patroni.md).
