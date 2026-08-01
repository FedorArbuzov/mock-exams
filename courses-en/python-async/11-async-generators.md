# 11. Async generators and async for

## Intro: "we loaded 2 GB of JSON into memory — OOMKill"

A service loaded a **paginated** API into a list comprehension — **2 GB** RSS, the pod **OOMKilled**. The solution: an **async generator** that **yields** pages as it **awaits** the fetch — memory is **O(page size)**, with backpressure via **async for**.

Streaming lab — [12-lab-streaming](12-lab-streaming.md); HTTP chunking — [25-websockets-sse](../fastapi/25-websockets-sse.md) (SSE/WebSocket at the API level).

## What you'll learn

- **`async def` + `yield`** → an async generator.
- **`async for`** and the **`__anext__`** protocol.
- **`asyncio.sleep(0)`** yield for fairness.
- **`aclosing`** (3.10+) for a guaranteed close.

---

## Async generator syntax

```python
import asyncio

async def count_to(n: int):
    for i in range(n):
        await asyncio.sleep(0.05)
        yield i

async def main():
    async for value in count_to(5):
        print("got", value)

asyncio.run(main())
```

| Sync generator | Async generator |
|----------------|-----------------|
| `def gen(): yield x` | `async def gen(): yield x` |
| `for x in gen()` | `async for x in gen()` |
| `next(gen())` | `await anext(gen())` |

**Lazy:** the code between yields runs **only** when the consumer requests the next element.

---

## HTTP pagination as a stream

```python
import httpx

BASE = "http://localhost:8095"

async def json_pages(client: httpx.AsyncClient, max_pages: int = 5):
    for page in range(max_pages):
        r = await client.get(f"{BASE}/json", params={"size": 10})
        r.raise_for_status()
        data = r.json()
        yield page, data["items"]

async def consume():
    async with httpx.AsyncClient(timeout=30) as client:
        total = 0
        async for page, items in json_pages(client, 3):
            total += len(items)
            print(f"page {page}: {len(items)} items")
        print("total items:", total)
```

On `/json` the size is limited by the query — for large volumes see the future chapters on backpressure ([32-backpressure-semaphores](32-backpressure-semaphores.md)).

---

## async for and break / cancel

```python
async def stream_events():
    try:
        for i in range(1000):
            await asyncio.sleep(0.01)
            yield {"seq": i}
    finally:
        print("generator cleanup")

async def consumer():
    async for event in stream_events():
        if event["seq"] >= 3:
            break
    print("consumer done")
```

**break** from `async for` → **`GeneratorExit`** / **`aclose`** on the generator — the **finally** in the generator **runs** (important for closing subscriptions).

---

## aclosing (3.10+)

```python
from contextlib import aclosing

async def main():
    async with aclosing(count_to(100)) as gen:
        async for i in gen:
            if i > 2:
                break
    # gen.aclose() guaranteed
```

Without **`aclosing`**, on a break the generator may not close immediately (it depends on GC).

---

## Merge streams (pattern)

```python
import asyncio

async def ticker(name: str, interval: float):
    n = 0
    while True:
        await asyncio.sleep(interval)
        n += 1
        yield f"{name}:{n}"

async def merge_first(*gens, limit: int = 5):
    # a simplified merge — for prod see asyncio.Queue
    pending = {asyncio.create_task(anext(g)): g for g in gens}
    count = 0
    while pending and count < limit:
        done, _ = await asyncio.wait(pending.keys(), return_when=asyncio.FIRST_COMPLETED)
        for task in done:
            gen = pending.pop(task)
            try:
                value = task.result()
                count += 1
                yield value
                pending[asyncio.create_task(anext(gen))] = gen
            except StopAsyncIteration:
                pass
```

For a production merge — a **Queue** ([14-asyncio-queues](14-asyncio-queues.md)).

---

## Relation to SSE / WebSocket

FastAPI's **StreamingResponse** can read an async generator:

```python
async def event_stream():
    for i in range(10):
        await asyncio.sleep(0.5)
        yield f"data: {{\"n\": {i}}}\n\n".encode()

# return StreamingResponse(event_stream(), media_type="text/event-stream")
```

An async generator is a **building block**; the wire format is the HTTP/SSE layer ([25-websockets-sse](../fastapi/25-websockets-sse.md)).

---

## Common mistakes

| Mistake | Consequence | Solution |
|--------|-------------|---------|
| `for x in async_gen()` | TypeError | `async for` |
| `yield` without await in a long loop | block the loop | `await asyncio.sleep(0)` |
| Not closing the generator | leaked subscription | `aclosing` / `finally` |
| Materialize all pages in a list | OOM | stream consume |
| Async gen from sync code | cannot iterate | `asyncio.run` consumer |

---

## Summary

**Async generators** produce values **lazily** via **`yield`** and **`await`**. The consumer is **`async for`**. They're ideal for **pagination**, **event streams**, **bounded memory**. Close the generator via **`finally`** or **`aclosing`**.

## Checklist

- How does an async generator differ from a list of awaits?
- What runs on `break` from an async for?
- Why `aclosing`?
- How can you use `/json` on 8095 as a paginated source?

Next lesson: [12. Lab: streaming data](12-lab-streaming.md).
