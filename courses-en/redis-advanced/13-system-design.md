# 13. System design: Redis in the interview

## Intro

Senior-level prompt: **“Design cache and sessions for a 50k RPS API, 5 GB catalog, peaks x5”**. They grade **trade-offs**, **failure modes**, and **operational** maturity — not “I installed Redis”.

## Answer framework (45 min)

1. **Requirements** (5 min) — read/write ratio, consistency, TTL, DR.
2. **Estimates** (5 min) — RAM, QPS per shard, network.
3. **API & key design** (5 min) — prefixes, TTL, hash tags.
4. **Architecture** (10 min) — diagram app, Redis, DB.
5. **Deep dives** (15 min) — stampede, hot keys, security, failover.
6. **Risks** (5 min) — OOM, split brain, cache penetration.

---

## Clarifying questions

- **Consistency:** is 30 s stale cache OK?
- **Durability:** sessions must not be lost → `noeviction` + persistence?
- **Multi-region:** active-active or cache per region?
- **Payload size:** median/max value?
- **Invalidation:** event-driven or TTL only?

---

## Back-of-envelope

Catalog example:

| Parameter | Value |
|----------|----------|
| SKU | 2M |
| JSON avg | 2 KB |
| Cold dataset | ~4 GB |
| Cache hit 90% @ 50k RPS | ~5k RPS to DB |
| Session | 500k × 2 KB ≈ 1 GB |
| **RAM target** | ~6 GB data + 30-50% overhead + replica ≈ **12-16 GB** |

```text
QPS per Redis core ~ 100k simple GET (ideal) → realistically 20-40k with TLS/JSON
→ 50k RPS may need 2-3 shards (Cluster) or bigger instance
```

---

## Cache-aside pattern

```mermaid
sequenceDiagram
  participant App
  participant R as Redis
  participant DB as PostgreSQL
  App->>R: GET key
  alt hit
    R-->>App: value
  else miss
    App->>DB: SELECT
    DB-->>App: row
    App->>R: SET EX TTL
  end
```

| Variant | When |
|---------|-------|
| Cache-aside | Universal |
| Write-through | Need write freshness |
| Write-behind | High write load (complexity) |

---

## Key design

```text
catalog:sku:{id}     EX 3600 ± jitter
session:{uuid}       EX 86400
ratelimit:{ip}:{min} EX 60
```

- **Prefix** for ACL `~catalog:*`.
- **UUID** session — not sequential hot keys.
- **Jitter** on TTL ([04](04-hot-keys-stampede.md)).

---

## Topology choice

| Option | Plus | Minus |
|---------|------|-------|
| Single primary + replicas | Simple | Vertical limit |
| Sentinel | Auto failover | No shard write scale |
| Cluster | Shard | Ops, CROSSSLOT |
| ElastiCache cluster mode | Managed | Vendor lock, cost |

---

## Failure modes (name them yourself)

| Risk | Mitigation |
|------|------------|
| Cache stampede | jitter, lock, singleflight |
| Hot key | sharded counter, local cache |
| OOM | maxmemory, policy, alerts on evicted_keys |
| Thundering herd on cold start | prewarm, gradual TTL |
| Penetration (fake ids) | bloom filter, short TTL null |

---

## Security (1 slide)

Private subnet, ACL per service, TLS, [firewall](../linux-intermediate/07-firewall.md), no `FLUSHALL` for app user ([07](07-security.md)).

---

## Monitoring

- `used_memory`, `evicted_keys`, `connected_clients`
- Latency p99 per node
- Hit rate (app metric)
- Replication lag / cluster state

---

## Summary

A strong answer = **numbers + diagram + 3 risks + what you do NOT put in Redis (large blobs, source of truth).

**Next:** [14. Lab: system design](14-lab-system-design.md).
