# 06. Memory: advanced

## Intro: “maxmemory is set, but the OOM Killer killed redis”

Config has `maxmemory 8gb` and `maxmemory-policy allkeys-lru`. At night the host **killed the process** — OOM Killer, not Redis eviction. `INFO memory` showed `used_memory` 7.2G, but **RSS** 11G: **fragmentation** and COW after `BGSAVE`. An advanced engineer reads memory as **several metrics**, not one number.

## What you'll learn

- `used_memory` vs **RSS**, **fragmentation**.
- **Eviction policies** — when to pick which.
- **lazyfree**, **active defrag**.
- **Big keys** audit and RAM planning in Cluster.

---

## INFO memory metrics

| Field | Meaning |
|------|-------|
| `used_memory` | Redis logic (allocator) |
| `used_memory_rss` | Real resident memory of the OS |
| `mem_fragmentation_ratio` | RSS / used (rule of thumb > 1.5 — pay attention) |
| `maxmemory` | Limit; 0 = no limit (dangerous) |
| `evicted_keys` | Eviction counter |

```bash
redis-cli INFO memory
redis-cli CONFIG GET maxmemory-policy
```

---

## Eviction policies

| Policy | Behavior | When |
|--------|-----------|-------|
| `noeviction` | Error on write when memory full | **Sessions**, must not lose keys |
| `allkeys-lru` | LRU among **all** keys | Pure cache |
| `volatile-lru` | LRU only with TTL | Cache + permanent keys without TTL |
| `allkeys-lfu` / `volatile-lfu` | LFU (Redis 4+) | Hot/cold cache |
| `volatile-ttl` | Keys with **shorter** TTL first | Predictable expiry |

**In the interview:** “Why noeviction for a queue?” — losing messages is worse than refusing writes → backpressure.

---

## Fragmentation and fork

- **jemalloc** leaves “holes” after deletions.
- `BGSAVE` / `AOF rewrite` → `fork()` → **copy-on-write** — RSS spike.
- **active defrag** (Redis 4+): `activedefrag yes` — CPU vs RAM trade-off.

```bash
redis-cli CONFIG SET activedefrag yes
redis-cli MEMORY DOCTOR
```

---

## Lazy freeing

A large `DEL` / `UNLINK` blocked the event loop. **`UNLINK`** (async free) and `lazyfree-lazy-user-del yes` — free in the background.

```bash
redis-cli MEMORY USAGE big:key
redis-cli UNLINK big:key
```

---

## Big keys

```bash
redis-cli --bigkeys
redis-cli --memkeys   # Redis 7.2+ (if available)
```

In Cluster, run **on each node** or use `--cluster`.

**RAM planning:**

```text
dataset + overhead(≈1.2-1.5) + replica buffer + COW headroom(≈same as dataset for fork)
```

---

## Common mistakes

- `maxmemory` **larger** than host RAM.
- No TTL on cache → `noeviction` + full RAM.
- Ignoring an `evicted_keys` spike after deploy.

---

## Summary

1. Look at **RSS** and **fragmentation**, not only `used_memory`.
2. Policy = **business contract** (cache vs durable keys).
3. Big keys — latency, replication, fork spike.

**Next:** [07. Security](07-security.md).
