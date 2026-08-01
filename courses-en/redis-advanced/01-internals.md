# 01. Redis internals

## Intro: “Redis is slow, but CPU is only 20%”

The team added a cache — API latency dropped from 200 ms to 5 ms. A month later it’s 150 ms again; Grafana shows **p99 on Redis**, and `top` on the Redis node shows **one core at 95%**, the rest idle. This isn’t a “not enough RAM” bug — it’s the **execution model**: Redis (classic OSS) processes commands **in a single thread** per instance. Understanding the event loop, queues, and command cost is required for advanced work and interviews.

## What you'll learn

- The **single-threaded** model and exceptions (I/O threads, modules).
- **Data structures** under the hood (SDS, ziplist/listpack, dict).
- **Pipelining** vs transactions vs Lua.
- **Persistence** at the “what blocks” level (brief; details in intermediate).
- Common **anti-patterns** and interviewer questions.

---

## Event loop and threads

Redis accepts connections (often via **epoll/kqueue**), reads requests from sockets, and executes commands **sequentially** on the main thread.

```mermaid
flowchart LR
  Clients[Clients]
  AE[ae epoll]
  Q[Command queue]
  Exec[Execute commands]
  Clients --> AE --> Q --> Exec
```

| Aspect | Consequence |
|--------|-----------|
| CPU-bound command (`KEYS *`, large `SORT`) | Blocks **all** clients on the instance |
| Many small commands | Parsing overhead; **pipeline** helps |
| Multiple instances | Scale **horizontally** (sharding, Cluster) |

**Redis 6+:** optional **I/O threads** offload socket read/write; **command logic** still runs on the main thread (unless a module has its own threads).

**In the interview:** “Why doesn’t Redis use all cores?” — deliberate trade-off: simpler semantics, less lock contention; scale via sharding.

---

## Data structures (simplified)

| Type | User sees | Internally (evolution) |
|-----|-------------------|-------------------|
| String | `SET k v` | SDS (binary-safe string) |
| List | `LPUSH` | listpack / linked list (depends on version/size) |
| Hash | `HSET` | hash table + listpack for small fields |
| Set | `SADD` | hash table (key = member) |
| ZSet | `ZADD` | skip list + hash table |
| Stream | `XADD` | radix tree of listpacks |

**Big-O** in the docs is for **one** command; constants and value size matter: `HGETALL` on a hash with 100k fields is a disaster.

---

## Pipelining, MULTI, Lua

| Mechanism | Purpose | Atomicity |
|----------|------------|-------------|
| **Pipeline** | Fewer RTTs; batch commands without waiting for replies between them | No between commands |
| **MULTI/EXEC** | Queue commands, run as a block | Yes, but no “read then decide” logic between WATCH and EXEC without races |
| **Lua / Function** | Script on the server | Atomic as one command |

Pipeline example (single-node stand `6379`):

```bash
redis-cli --pipe <<'EOF'
SET bench:1 1
SET bench:2 2
SET bench:3 3
EOF
```

**Beginner mistake:** 10k sequential `GET`s from the app without a pipeline — you hit the **network**, not Redis CPU.

---

## Memory and allocator

Redis typically uses **jemalloc**. Keys, values, metadata — all in **RSS**. `INFO memory` is the first screen for OOM ([06](06-memory-advanced.md), [10-lab-oom-recovery](10-lab-oom-recovery.md)).

---

## Persistence (overview)

| Mode | Plus | Minus |
|-------|------|-------|
| RDB | Compact snapshot, fast restart | Data loss between snapshots |
| AOF | Fresher data | File size, rewrite I/O |
| RDB+AOF | Prod compromise | More complex ops |

`fork()` for RDB/AOF rewrite → short **copy-on-write** spike — “Redis ate twice the RAM”.

---

## Anti-patterns

| Bad | Why | Better |
|-------|--------|-------|
| `KEYS pattern` | O(N) over all keys, blocks | `SCAN` |
| Huge values (> MB) | Network, latency, replication lag | Chunk, external store + id in Redis |
| Cache without TTL | Memory leak | TTL + maxmemory policy |
| One key for all counters | Hot key | Sharded counter, local agg |
| Transactions as locking | No unlock on crash | Redlock / DB lock ([15](15-patterns-redlock.md)) |

---

## On the stand

```bash
cd deploy/redis && docker compose up -d
redis-cli INFO server | head -20
redis-cli --latency-history -i 1
redis-cli SLOWLOG LEN
redis-cli CONFIG GET io-threads
```

---

## Common mistakes

- Looking only at **average** latency, ignoring **slowlog** and p99.
- Comparing Redis to **PostgreSQL** as a “universal DB” — different durability contracts.
- Enabling **AOF always** without understanding throughput.

---

## Summary for the interview

1. **One main thread** per command → avoid blocking O(N) operations.
2. **Pipeline** is about RTT; **Lua** is about atomic logic.
3. **Structures** change across versions — complexity and value size matter.
4. Scale is **not “more cores on one instance”**, but **sharding / Cluster**.

**Next:** [02. Cluster](02-cluster.md) — how Redis scales writes.
