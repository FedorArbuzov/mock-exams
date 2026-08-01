# Redis — Basic

Basic level: **why Redis**, **architecture and data types**, **cache and sessions**, **Pub/Sub**, **pipeline and transactions**, **memory and eviction**, **CLI and observability**.

**Prerequisites:** basic Linux and Docker ([`linux-basic`](../linux-basic/README.md) or [`linux-intermediate`](../linux-intermediate/README.md) — `docker compose` and a terminal are enough).

**Locally:** [`deploy/redis`](../../deploy/redis/README.md) — `docker compose up -d`, from the host: **`localhost:6379`**, Redis Commander: [http://localhost:8081](http://localhost:8081).

**Next:** [`redis-intermediate`](../redis-intermediate/README.md) (replication, Sentinel, ACL), [`redis-advanced`](../redis-advanced/README.md).

## How to read the chapters

Each lesson is a **book chapter**, not a cheat sheet. Recommended order within a pair:

1. Read the **theory** (01, 02, 04…) — don't skip the intro and "common mistakes".
2. Open the **lab** (03-lab, 05-lab…) with the stand running via `docker compose up -d` in `deploy/redis`.
3. Complete the tasks **in order**; compare output against the "what you'll see" block.
4. If something doesn't add up — [`deploy/redis/README.md`](../../deploy/redis/README.md) (healthcheck, ports, `maxmemory`).

**Theory structure:** intro (a scenario from work) → what you'll learn → concepts → example on the stand → mistakes → in production → summary → checklist.

**Lab structure:** goal → prerequisites → tasks 1…N (why / commands / what you'll see) → success criteria.

**Time:** about **40–50 minutes** per "theory + lab" pair; [final project](17-final-project.md) — **2–3 hours**.

**Connection cheat sheet:**

| From | Address |
|--------|--------|
| Host (`redis-cli`, application) | `localhost:6379` |
| Inside the Docker network | `redis:6379` |
| Redis Commander | [http://localhost:8081](http://localhost:8081) |

CLI inside the container: `docker exec -it mock-redis redis-cli` (see labs).

## Curriculum

### Basics (01–03)

1. [Why Redis](01-why-redis.md)
2. [Architecture: memory, single-thread, keys](02-architecture.md)
3. [Lab: first keys and TTL](03-lab-first-keys.md)

### Data types and applications (04–05)

4. [Data types: string, hash, list, set, zset](04-data-types.md) · 5. [Lab: session and cart](05-lab-session-cart.md)

### Cache (06–07)

6. [Patterns: cache-aside, TTL, stampede](06-patterns-cache.md) · 7. [Lab: cache-aside](07-lab-cache-aside.md)

### Pub/Sub (08–09)

8. [Pub/Sub: channels and limitations](08-pubsub.md) · 9. [Lab: notifications via Pub/Sub](09-lab-pubsub.md)

### Performance (10–11)

10. [Pipeline and MULTI/EXEC transactions](10-pipeline-transactions.md) · 11. [Lab: pipeline](11-lab-pipeline.md)

### Memory (12–13)

12. [Memory, maxmemory, eviction](12-memory-eviction.md) · 13. [Lab: eviction on the stand](13-lab-eviction.md)

### Operations (14–15)

14. [CLI: INFO, SCAN, SLOWLOG](14-cli-observability.md) · 15. [Lab: heavy keys](15-lab-heavy-keys.md)

### Comparison and finale (16–17)

16. [Redis vs Memcached vs Kafka](16-vs-memcached-kafka.md)
17. [Final project](17-final-project.md)

## What you should end up with

- You can explain how an **in-memory store** differs from a **database** and a **message broker**.
- You work with **keys**, **TTL**, **hash/list/set/zset** via `redis-cli`.
- You implement a **session**, a **cart** and **cache-aside** on the stand.
- You use **Pub/Sub**, **PIPELINE**, and understand **eviction** under `maxmemory`.
- You diagnose via **INFO**, **SCAN**, **SLOWLOG**; you compare Redis with Memcached and Kafka.

## Examples

| Path | Purpose |
|------|------------|
| [`examples/session.json`](examples/session.json) | sample session payload for lab 05 |
| [`examples/rate-limit-keys.txt`](examples/rate-limit-keys.txt) | key convention for the final project (rate limit) |
