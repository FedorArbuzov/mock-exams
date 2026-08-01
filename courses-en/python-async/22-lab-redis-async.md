# 22. Lab: Redis async cache

## Lab goal

Implement **cache-aside** on top of the data from [20-lab-async-database](20-lab-async-database.md): read the `fetch_log` aggregate through Redis, invalidate it on insert, and measure the speedup of repeated requests.

## Prerequisites

- [21-redis-asyncio](21-redis-asyncio.md).
- Stands: [`deploy/redis`](../../deploy/redis/README.md), [`deploy/postgres`](../../deploy/postgres/README.md).
- The `fetch_log` table is populated (lab 20).

```bash
cd deploy/redis && docker compose up -d
redis-cli -h localhost -p 6379 ping
```

---

## Task 1. Basic client and keys

`labs/22_cache.py` (a fragment):

```python
import asyncio
import json
import time

import redis.asyncio as redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

DATABASE_URL = "postgresql+asyncpg://course:course@localhost:5432/course"
REDIS_URL = "redis://localhost:6379/0"
CACHE_KEY = "stats:fetch_log:summary"
CACHE_TTL = 30

engine = create_async_engine(DATABASE_URL, pool_size=5)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_redis() -> redis.Redis:
    return redis.from_url(REDIS_URL, decode_responses=True)
```

---

## Task 2. Load from DB

```python
async def load_summary_from_db() -> dict:
    async with SessionLocal() as session:
        r = await session.execute(text("""
            SELECT COUNT(*) AS cnt,
                   COALESCE(AVG(latency_ms), 0) AS avg_ms
            FROM fetch_log
        """))
        row = r.mappings().one()
        return {"count": row["cnt"], "avg_ms": float(row["avg_ms"])}
```

---

## Task 3. Cache-aside get

```python
async def get_summary(rds: redis.Redis) -> dict:
    cached = await rds.get(CACHE_KEY)
    if cached:
        return json.loads(cached)

    data = await load_summary_from_db()
    await rds.setex(CACHE_KEY, CACHE_TTL, json.dumps(data))
    return data
```

**Run:**

```python
async def main():
    rds = await get_redis()
    try:
        t0 = time.perf_counter()
        first = await get_summary(rds)
        t1 = time.perf_counter()
        second = await get_summary(rds)
        t2 = time.perf_counter()
        print("first:", first, f"{(t1-t0)*1000:.1f}ms")
        print("second (cache):", second, f"{(t2-t1)*1000:.1f}ms")
    finally:
        await rds.aclose()

if __name__ == "__main__":
    asyncio.run(main())
```

**What you'll see:** the second call **< 5 ms** (Redis), the first — tens of ms (Postgres).

---

## Task 4. Invalidation on write

```python
async def insert_and_invalidate(rds: redis.Redis) -> None:
    async with SessionLocal() as session:
        await session.execute(
            text("INSERT INTO fetch_log (url, status_code, latency_ms) VALUES (:u, 200, 1.0)"),
            {"u": "http://localhost:8095/health"},
        )
        await session.commit()
    await rds.delete(CACHE_KEY)
    print("cache invalidated")

async def demo_invalidate():
    rds = await get_redis()
    await get_summary(rds)  # warm cache
    await insert_and_invalidate(rds)
    fresh = await get_summary(rds)
    print("after insert:", fresh)
    await rds.aclose()
```

**What you'll see:** `count` increased by 1 after the invalidate.

---

## Task 5. Concurrent readers (thundering herd lite)

**Why:** 10 coroutines on a cache miss — only one should go to the DB (simplified via a lock).

```python
_lock = asyncio.Lock()

async def get_summary_safe(rds: redis.Redis) -> dict:
    cached = await rds.get(CACHE_KEY)
    if cached:
        return json.loads(cached)

    async with _lock:
        cached = await rds.get(CACHE_KEY)
        if cached:
            return json.loads(cached)
        data = await load_summary_from_db()
        await rds.setex(CACHE_KEY, CACHE_TTL, json.dumps(data))
        return data

async def concurrent_get():
    rds = await get_redis()
    await rds.delete(CACHE_KEY)
    results = await asyncio.gather(*[get_summary_safe(rds) for _ in range(10)])
    assert all(r == results[0] for r in results)
    print("all equal:", results[0])
    await rds.aclose()
```

**What you'll see:** the same dict for all 10; in the Postgres logs — **one** heavy SELECT (check `log_min_duration` on the stand).

---

## Task 6. TTL expiry

```python
async def demo_ttl():
    rds = await get_redis()
    await rds.setex("demo:ttl", 2, "x")
    print("ttl:", await rds.ttl("demo:ttl"))
    await asyncio.sleep(2.5)
    print("after sleep:", await rds.get("demo:ttl"))
    await rds.aclose()
```

**What you'll see:** `None` after the TTL expires.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| Connection refused 6379 | `docker compose ps` in deploy/redis |
| Cache always misses | check `CACHE_KEY`, `decode_responses` |
| count=0 | run lab 20 first |
| second call still slow | Redis is the wrong host; check the URL |

---

## Success criteria

- [ ] Cache hit is faster than a cache miss (measured)
- [ ] Insert + `delete` updates the aggregate
- [ ] 10 concurrent gets with a lock — a consistent result
- [ ] The TTL demo works
- [ ] `aclose()` is called

---

## Cleanup

```bash
redis-cli -h localhost -p 6379 DEL stats:fetch_log:summary demo:ttl
```

---

## Self-check questions

1. Why `delete` after a write and not `set` right away?
2. How does an in-process `Lock` differ from a Redis lock (Redlock)?
3. When is TTL=30 too long for a dashboard?
4. Where is Redis in [36-capstone](36-capstone.md)?

Next lesson: [23. Executors and blocking](23-executors-blocking.md).
