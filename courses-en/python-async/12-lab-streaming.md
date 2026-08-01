# 12. Lab: streaming data

## Lab goal

Implement an **async generator** for "paginated" loading from the gateway, a consumer with an **early break**, and proper **cleanup**. Compare the **peak memory** of list vs stream (roughly).

## Prerequisites

- [11-async-generators](11-async-generators.md).
- The **8095** stand, venv + httpx.

```bash
curl -s "http://localhost:8095/json?size=50" | head -c 200
```

---

## Task 1. An async generator of pages

**Why:** lazy fetch instead of one giant response.

`labs/12_stream_pages.py`:

```python
import asyncio
from contextlib import aclosing

import httpx

BASE = "http://localhost:8095"

async def fetch_pages(
    client: httpx.AsyncClient,
    sizes: list[int],
):
    """Simulating pagination: a different size on each "page"."""
    for idx, size in enumerate(sizes):
        r = await client.get(f"{BASE}/json", params={"size": size})
        r.raise_for_status()
        body = r.json()
        yield idx, body["service"], body["items"]

async def main():
    sizes = [5, 10, 20, 50, 100]
    async with httpx.AsyncClient(timeout=30.0) as client:
        total = 0
        async for page, service, items in fetch_pages(client, sizes):
            total += len(items)
            print(f"page {page} service={service} items={len(items)}")
        print("total items:", total)

if __name__ == "__main__":
    asyncio.run(main())
```

**What you'll see:** 5 lines of page summary, `total items: 185`.

---

## Task 2. Early break + aclosing

**Why:** consumer control + a guaranteed close.

```python
async def consume_partial():
    async with httpx.AsyncClient(timeout=30.0) as client:
        async with aclosing(fetch_pages(client, [10, 20, 30, 40])) as gen:
            async for page, service, items in gen:
                print(f"partial page {page}: {len(items)}")
                if page >= 1:
                    break
    print("partial done")

asyncio.run(consume_partial())
```

**What you'll see:** 2 pages, `partial done`. In the generator's `finally` (if you add it) — a cleanup message.

Add to `fetch_pages`:

```python
    try:
        for idx, size in enumerate(sizes):
            ...
            yield idx, body["service"], body["items"]
    finally:
        print("fetch_pages cleanup")
```

**What you'll see:** `fetch_pages cleanup` even on break.

---

## Task 3. Materialized vs stream (concept)

**Why:** to understand the memory trade-off.

```python
async def materialized(client, sizes):
    pages = []
    async for p in fetch_pages(client, sizes):
        pages.append(p)
    return pages

async def streaming_count(client, sizes):
    n = 0
    async for _, _, items in fetch_pages(client, sizes):
        n += len(items)
    return n
```

Run both with `sizes = [100] * 10` (if the gateway allows size=100).

**What you'll see:** the same count; materialized keeps **all** pages in RAM, streaming — only the current page.

---

## Task 4. A slow stream with fairness

**Why:** don't block the loop in a tight generator.

```python
async def slow_ticks(n: int):
    for i in range(n):
        await asyncio.sleep(0.1)
        await asyncio.sleep(0)  # yield to loop
        yield i

async def background():
    async for i in slow_ticks(5):
        print("tick", i)

async def with_parallel():
    asyncio.create_task(watch := asyncio.create_task(asyncio.sleep(0.05) or None))
    async for i in slow_ticks(3):
        print("main", i)
```

Simplify: run `slow_ticks` and a parallel `asyncio.create_task` that prints a "heartbeat" every 50ms.

**What you'll see:** the heartbeat and ticks **interleave** — the loop isn't blocked.

---

## Task 5. Pipeline into a Queue (preview)

**Why:** a bridge to [14-asyncio-queues](14-asyncio-queues.md).

```python
async def producer(q: asyncio.Queue, sizes: list[int]):
    async with httpx.AsyncClient(timeout=30) as client:
        async for page, svc, items in fetch_pages(client, sizes):
            await q.put((page, len(items)))
    await q.put(None)  # sentinel

async def consumer(q: asyncio.Queue):
    while True:
        item = await q.get()
        if item is None:
            break
        print("queued page", item)
        q.task_done()
```

Run the producer and consumer as two tasks in one `main()`.

**What you'll see:** the consumer prints pages as they arrive.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| `async for` TypeError | the generator isn't async — check `async def` + `yield` |
| Cleanup isn't printed | use `aclosing` or wait for GC |
| size > 1000 rejected | gateway limit — reduce the size |
| Generator hangs | client timeout; cancel with Ctrl+C |

---

## Success criteria

- [ ] fetch_pages yields 5 pages, total 185 items
- [ ] break + finally cleanup is visible
- [ ] You understand the RAM trade-off of materialized vs stream
- [ ] heartbeat interleaves with slow_ticks
- [ ] The producer-consumer preview works

---

## Cleanup

Keep the scripts. Leave the stand for phase 3.

---

## Self-check questions

1. When is an async generator preferable to `gather` over all pages?
2. What does the sentinel `None` do in a Queue?
3. Why `await asyncio.sleep(0)` in a generator?
4. How is this related to SSE in FastAPI?

Next lesson: [13. Lock, Semaphore, Event](13-primitives-locks.md).
