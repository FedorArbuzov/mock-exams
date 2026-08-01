# 16. Valkey and Redis Stack

## Intro: licensing and “what to run in 2026”

After Redis Ltd’s license change, part of the industry moved to **Valkey** (Linux Foundation) as an OSS-compatible fork. **Redis Stack** (modules: Search, JSON, Bloom, TimeSeries) is a separate product path. In interviews they expect: the **RESP protocol is compatible**, but you know the **operational** and **legal** differences.

## What you'll learn

- **Valkey** vs Redis OSS vs Enterprise.
- **Redis Stack** modules — when you need them.
- Managed: **ElastiCache**, **MemoryDB**, **Azure Cache**.
- Migration and client risks.

---

## Valkey

| Aspect | Detail |
|--------|--------|
| Origin | Fork of Redis 7.2 after the license change |
| Protocol | Compatible with redis-cli and most clients |
| Governance | Linux Foundation; AWS/Google/Oracle participate |
| Versions | Track feature parity; check release notes |

**Ops:** same playbooks — replication, Cluster, ACL. Docker images: `valkey/valkey`.

```bash
docker run --rm valkey/valkey:8 valkey-cli PING
```

**In the interview:** “What changes in the app?” — usually **nothing**, if you don’t use Redis Ltd proprietary modules.

---

## Redis Stack (modules)

| Module | Use case |
|--------|----------|
| RedisJSON | Document in one key, JSONPath |
| RediSearch | Full-text, secondary indexes |
| RedisBloom | Bloom / Cuckoo filter |
| RedisTimeSeries | Metrics, downsampling |

When you **don’t** need Stack:

- Simple cache-aside — strings/hashes are enough.
- Full-text — Elasticsearch/OpenSearch may be easier for the team.

When you **do**:

- Low-latency search on hot data already in Redis.
- Probabilistic filter (`BF.ADD`) for cache penetration.

---

## Managed services

| Service | Trait |
|--------|-------------|
| ElastiCache Redis/Valkey | Cluster mode, Multi-AZ, auth token |
| MemoryDB | Redis-compatible, **durable** log-first |
| Confluent — N/A | — |
| Azure Cache for Redis | Enterprise tiers with modules |

**MemoryDB vs ElastiCache:** MemoryDB — when Redis is a **primary** store with durability; ElastiCache — classic cache.

---

## Migration

1. Benchmark staging (latency, memory).
2. Check **modules** and **ACL**.
3. Rolling replace replicas → failover master.
4. Clients: redisson, lettuce — versions tested with Valkey.

---

## Summary

1. **Valkey** — OSS alternative with the same protocol.
2. **Stack** — modules, not required for cache-only.
3. Managed removes **patching/failover**, not **key design**.

**Next:** [17. K8s operators](17-k8s-operators.md).
