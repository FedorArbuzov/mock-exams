# 09. Troubleshooting Redis in production

## Intro: a runbook at 3 a.m.

Alert: **API latency p99**, Redis **connected_clients** growing, `rejected_connections` > 0. Or: `OOM command not allowed when used memory > maxmemory`. This chapter is a **diagnostic order**, not a full catalog of every bug.

## What you'll learn

- **Latency**: slowlog, latency doctor, intrinsic latency.
- **Memory / OOM**: maxmemory, eviction, killer.
- **Replication lag**, **CLUSTERDOWN**.
- **Connection storms**, timeouts.

---

## First 5 minutes (any incident)

```bash
redis-cli PING
redis-cli INFO server
redis-cli INFO clients
redis-cli INFO memory
redis-cli INFO stats
redis-cli SLOWLOG GET 20
```

| Symptom | Where to look |
|---------|----------------|
| All commands slow | CPU, slowlog, big keys, AOF always |
| Writes only | Disk AOF, replication backlog |
| One app only | App keys/pattern |
| Cluster partial | `CLUSTER INFO`, `CLUSTER NODES` |

---

## Latency

```bash
redis-cli --latency
redis-cli --latency-history -i 1
redis-cli LATENCY DOCTOR
redis-cli LATENCY LATEST
```

| Cause | Sign |
|---------|---------|
| Blocking command | Spike in slowlog: `KEYS`, `SAVE`, large `SUNION` |
| Fork COW | Latency during `BGREWRITEAOF` |
| Network | `redis-cli --latency` between app host and Redis |
| Hot key | One master, commandstats |

**Intrinsic latency** (hardware):

```bash
redis-cli --intrinsic-latency 100
```

---

## Memory and OOM

| Redis reply | Meaning |
|-------------|----------|
| `OOM command not allowed` | `maxmemory` + `noeviction` or no room for policy |
| Process killed | Host OOM killer — RSS > RAM |

Actions: [10-lab-oom-recovery](10-lab-oom-recovery.md), [06](06-memory-advanced.md).

```bash
redis-cli INFO memory | grep -E 'used_memory|maxmemory|evicted|fragmentation'
redis-cli MEMORY STATS
```

---

## Replication

```bash
redis-cli INFO replication
```

| Field | Problem |
|------|----------|
| `master_link_status:down` | Network, auth, master down |
| `master_repl_offset` vs replica offset | Lag |
| `repl_backlog_active:0` | Partial resync impossible — full sync |

Full resync on a large dataset — **network + disk burst**.

---

## Cluster

```bash
redis-cli -c -p 7001 CLUSTER INFO
redis-cli -c -p 7001 CLUSTER NODES
```

| `cluster_state` | Action |
|-----------------|----------|
| `fail` | How many masters up? quorum? |
| `ok` but apps fail | Client without cluster mode, stale slot map |

After restarting all nodes without a persistent volume — re-run **`init-cluster.sh`**.

---

## Connections

```bash
redis-cli INFO clients
redis-cli CLIENT LIST | head
redis-cli CONFIG GET maxclients
```

**Connection storm** — pool in the app, not a new TCP per HTTP request.

---

## “In the interview” checklist

1. Clarify: standalone / Sentinel / Cluster / managed?
2. **Recent change** (deploy, flush, resharding)?
3. **Metrics**: memory, ops/sec, latency, evicted_keys.
4. **Slowlog** and **big keys**.
5. **Blast radius** — one service or the whole cluster?

---

## Summary

Redis diagnosis is **INFO + slowlog + cluster state**, not reboot “for luck”.

**Next:** [10. Lab: OOM recovery](10-lab-oom-recovery.md).
