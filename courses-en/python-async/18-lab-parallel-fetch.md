# 18. Lab: parallel fetch

## Lab goal

Reproduce the gateway logic of **`/aggregate`** and **`/aggregate-parallel`** locally: three upstream JSON fetches **sequential vs parallel**, measuring **wall-clock**, handling a **503** on one upstream. Reinforce **httpx**, **gather**, **TaskGroup**, **Semaphore**.

## Prerequisites

- [09-gather-vs-taskgroup](09-gather-vs-taskgroup.md), [17-async-http-httpx](17-async-http-httpx.md).
- The **8095** stand healthy.

```bash
curl -s -w "\nseq:%{time_total}s\n" http://localhost:8095/aggregate
curl -s -w "\npar:%{time_total}s\n" http://localhost:8095/aggregate-parallel
```

Record the baseline: sequential ~**1 s**, parallel ~**0.5 s**.

---

## Task 1. Three "upstream" URLs

**Why:** simulating microservices A/B/C through one gateway (different path/delay).

```python
UPSTREAMS = [
    "http://localhost:8095/slow?extra_ms=0",   # ~200ms base
    "http://localhost:8095/slow?extra_ms=50",  # ~250ms
    "http://localhost:8095/slow?extra_ms=100", # ~300ms
]
# or /json?size=5 for all three — closer to the gateway aggregate
JSON_UPSTREAMS = [
    "http://localhost:8095/json?size=5",
] * 3
```

The gateway fan-out goes to **slow-a/b/c** inside compose; from the host, use **slow** with a different extra_ms as a proxy.

---

## Task 2. Sequential aggregator

`labs/18_sequential.py`:

```python
import asyncio
import time

import httpx

UPSTREAMS = [
    "http://localhost:8095/json?size=5",
    "http://localhost:8095/json?size=5",
    "http://localhost:8095/json?size=5",
]

async def fetch_one(client: httpx.AsyncClient, url: str) -> dict:
    r = await client.get(url)
    r.raise_for_status()
    return r.json()

async def aggregate_sequential(client: httpx.AsyncClient) -> list[dict]:
    results = []
    for url in UPSTREAMS:
        results.append(await fetch_one(client, url))
    return results

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        data = await aggregate_sequential(client)
    print(f"sequential: {time.perf_counter() - t0:.3f}s")
    print("services:", [d.get("service") for d in data])

if __name__ == "__main__":
    asyncio.run(main())
```

**What you'll see:** ~**0.6–1.0 s** (the sum of upstream delays via the gateway routing).

---

## Task 3. Parallel aggregator (gather)

`labs/18_parallel_gather.py`:

```python
async def aggregate_parallel_gather(client: httpx.AsyncClient) -> list[dict]:
    return list(await asyncio.gather(*(fetch_one(client, u) for u in UPSTREAMS)))

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        data = await aggregate_parallel_gather(client)
    print(f"parallel gather: {time.perf_counter() - t0:.3f}s")
```

**What you'll see:** ~**0.25–0.4 s** — close to the **max** delay, comparable to `/aggregate-parallel`.

---

## Task 4. Parallel via TaskGroup

```python
async def aggregate_parallel_tg(client: httpx.AsyncClient) -> list[dict]:
    async with asyncio.TaskGroup() as tg:
        tasks = [tg.create_task(fetch_one(client, u)) for u in UPSTREAMS]
    return [t.result() for t in tasks]
```

**What you'll see:** the time ≈ the gather version.

---

## Task 5. Semaphore + 12 URLs

**Why:** many upstreams with a limit.

```python
SEM = asyncio.Semaphore(4)
URLS = [f"http://localhost:8095/slow?extra_ms={i*10}" for i in range(12)]

async def fetch_limited(client, url):
    async with SEM:
        return await fetch_one(client, url)

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30) as client:
        await asyncio.gather(*(fetch_limited(client, u) for u in URLS))
    print(f"12 urls sem4: {time.perf_counter() - t0:.3f}s")
```

**What you'll see:** batches of ~4 concurrent — the time is between pure gather(12) and sequential.

---

## Task 6. Partial failure

**Why:** one upstream on `/fail`, the rest ok.

```python
MIXED = [
    "http://localhost:8095/json?size=3",
    "http://localhost:8095/fail?rate=1.0",
    "http://localhost:8095/json?size=3",
]

async def demo_partial():
    async with httpx.AsyncClient(timeout=30) as client:
        results = await asyncio.gather(
            *(fetch_one(client, u) for u in MIXED),
            return_exceptions=True,
        )
        for i, r in enumerate(results):
            print(i, "ok" if not isinstance(r, Exception) else type(r).__name__)
```

**What you'll see:** `[0 ok, 1 HTTPStatusError, 2 ok]` — the degraded aggregate pattern ([09-gather-vs-taskgroup](09-gather-vs-taskgroup.md)).

---

## Task 7. Cross-checking with the gateway source

Read the `aggregate` and `aggregate_parallel` functions in [`app.py`](../../deploy/python-async/mock-server/app.py). Your parallel gather is **isomorphic** to the gateway logic.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| parallel ≈ sequential | requests not concurrent — one client, gather ok? |
| 502 aggregate | `docker compose ps` — upstream healthy |
| fail lab always errors | `/fail?rate=0.3` |
| TaskGroup on 3.10 | use only gather |

---

## Success criteria

- [ ] sequential slower ~2× than parallel (for 3 upstreams)
- [ ] parallel ≈ curl `/aggregate-parallel` order of magnitude
- [ ] TaskGroup and gather — comparable time
- [ ] Semaphore(4) on 12 urls — bounded concurrency
- [ ] partial failure with return_exceptions is clear
- [ ] Read the gateway aggregate* source

---

## Cleanup

```bash
# optional
cd deploy/python-async && docker compose down
```

The `labs/18_*.py` scripts — the base for [36-capstone](36-capstone.md).

---

## Self-check questions

1. Why is the sequential time ≈ sum, and parallel ≈ max?
2. When is TaskGroup better than gather for an aggregate?
3. How do you return 200 with partial data on a single 503?
4. How is this course deeper than [27-async-patterns](../fastapi/27-async-patterns.md)?
5. How do you add a Redis cache to the aggregate ([28-redis-cache](../fastapi/28-redis-cache.md))?

**Phases 1–3 complete.** Next — blocking code and executors ([19-asyncpg-database](19-asyncpg-database.md)).
