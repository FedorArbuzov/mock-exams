# 11. Interview Q&A — top 30 questions with answers

Format: **question** → **short answer** (30 s) → **deep dive** (2–3 min). Table: [`interview-cheatsheet.md`](interview-cheatsheet.md).

---

## Architecture and model

### 1. Why Redis, not PostgreSQL as a cache?

**Short:** In-memory, sub-ms latency, data structures; not a durable DB replacement.

**Deep dive:** Redis is **cache / session / rate limit / pub-sub** with an explicit crash-loss contract (unless AOF/cluster). PG is source of truth, ACID.

### 2. Why is Redis “single-threaded”?

**Short:** One thread executes commands → no lock contention; scale by sharding.

**Deep dive:** I/O threads offload the network; CPU-bound `KEYS` blocks everyone. Cluster = several main threads on different nodes ([01](01-internals.md)).

### 3. What is a pipeline?

**Short:** A batch of commands without waiting for replies between them — saves RTT.

**Deep dive:** Not atomicity; for atomic logic — Lua/MULTI. Be careful with pipeline size (buffer memory).

### 4. Difference between MULTI and Lua?

**Short:** MULTI/EXEC — a queue; Lua — branching and conditions atomically.

**Deep dive:** WATCH for optimistic locking; Lua must not run long. Cluster: keys in one slot.

### 5. RDB vs AOF?

**Short:** RDB — snapshot; AOF — command log; AOF is often fresher, heavier.

**Deep dive:** `everysec` compromise; rewrite I/O; hybrid Redis 7. Backup ≠ replication.

---

## Replication and HA

### 6. Async replication — what do we lose?

**Short:** On master crash after client ACK — recent writes may not have reached the replica.

**Deep dive:** WAIT command (rare); Sentinel/Cluster failover — promote with lag. Not strong consistency.

### 7. Sentinel vs Cluster?

**Short:** Sentinel — failover of one master; Cluster — sharding + failover.

**Deep dive:** [02](02-cluster.md). Sentinel is simpler until you hit one-node RAM/CPU limits.

### 8. How many Sentinels?

**Short:** Minimum 3 for quorum, odd number.

**Deep dive:** Split-brain under partition; `down-after-milliseconds`, `failover-timeout`.

### 9. What is replica read?

**Short:** Read from replica → eventual consistency, less load on master.

**Deep dive:** Lag metrics; not for “read right after write” without checking offset.

### 10. CLUSTERDOWN?

**Short:** No majority of masters, or slots not covered.

**Deep dive:** [09](09-troubleshooting.md); init cluster; `cluster-require-full-coverage`.

---

## Cluster and keys

### 11. How many hash slots?

**Short:** 16384; `CRC16(key) mod 16384`.

**Deep dive:** Historical balance of metadata vs flexibility; doesn’t change without a new protocol version.

### 12. MOVED vs ASK?

**Short:** MOVED — permanent slot redirect; ASK — temporary during migration.

**Deep dive:** Client updates slot cache; `ASKING` before ASK.

### 13. Why hash tags?

**Short:** `{user:1}` in the key — shared slot for multi-key ops.

**Deep dive:** Hot slot risk; deliberate locality vs balance trade-off.

### 14. Can you use `KEYS *` in prod?

**Short:** No — O(N), blocks the instance.

**Deep dive:** `SCAN` cursor; `--bigkeys` in a maintenance window.

### 15. CROSSSLOT?

**Short:** A multi-key command touched keys from different slots.

**Deep dive:** Hash tag or data redesign.

---

## Memory and performance

### 16. maxmemory-policy for cache?

**Short:** `allkeys-lru` or `allkeys-lfu`; TTL preferred.

**Deep dive:** [06](06-memory-advanced.md); `noeviction` for queues/sessions if you must not lose data.

### 17. High mem_fragmentation_ratio?

**Short:** RSS >> used_memory; OOM killer risk.

**Deep dive:** active defrag; restart; jemalloc; after big DEL.

### 18. How to find a hot key?

**Short:** commandstats, latency, proxy metrics, `--hotkeys` on staging.

**Deep dive:** [04](04-hot-keys-stampede.md); sharded key; local cache.

### 19. Cache stampede?

**Short:** Mass miss → DB overload.

**Deep dive:** TTL jitter, lock, singleflight ([05](05-lab-stampede.md)).

### 20. Why are large values bad?

**Short:** Network, latency, replication, blocking on DEL.

**Deep dive:** UNLINK; store blob in S3, id in Redis.

---

## Security and patterns

### 21. How to protect Redis in a VPC?

**Short:** Private subnet, SG, ACL, TLS, no public 6379, host firewall.

**Deep dive:** [07](07-security.md), [firewall](../linux-intermediate/07-firewall.md).

### 22. ACL vs requirepass?

**Short:** ACL — multiple users, commands and keys; requirepass — one legacy password.

**Deep dive:** `default off`; app user `~prefix:* +@read +@write`.

### 23. Is Redlock reliable?

**Short:** Controversial; Martin Kleppmann critique — clock skew, fencing.

**Deep dive:** [15](15-patterns-redlock.md); for cache lock, SET NX + TTL on one instance often enough; critical — DB/Consul.

### 24. Rate limiting in Redis?

**Short:** INCR + EXPIRE; sliding window in ZSET; Cell algorithm in a module.

**Deep dive:** Atomic Lua; sharded counters for hot keys.

### 25. Pub/Sub vs Streams?

**Short:** Pub/Sub — fire-and-forget, no persistence; Streams — log, consumer groups.

**Deep dive:** Message loss on disconnect in pub/sub; Streams ≈ lightweight Kafka for one DC.

---

## Design and managed

### 26. Session store in Redis?

**Short:** TTL, replication, sticky optional; encrypt PII.

**Deep dive:** `noeviction` vs session loss; Cluster session affinity not required if session id is in the key.

### 27. Redis vs Memcached?

**Short:** Redis — structures, persistence, replication; Memcached — simple multithreaded cache.

**Deep dive:** Choice by ops model; Memcached doesn’t replace Streams/Lua.

### 28. ElastiCache vs self-hosted?

**Short:** Managed patches, Multi-AZ; you own sizing, params, clients.

**Deep dive:** [17](17-k8s-operators.md); cluster mode enabled; auth token.

### 29. Valkey vs Redis?

**Short:** Valkey — OSS fork post-license; protocol compatible; ecosystem is moving.

**Deep dive:** [16](16-valkey-stack.md); check clients and modules.

### 30. Design a 50k RPS cache?

**Short:** RAM estimate, TTL, eviction, sharding, cache-aside, stampede protection, monitoring.

**Deep dive:** [13](13-system-design.md), [14](14-lab-system-design.md).

---

## Next

Practice: [12. mock interview](12-lab-mock-interview.md) · Cheatsheet: [interview-cheatsheet](interview-cheatsheet.md)
