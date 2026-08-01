# 06. Lab: concurrent I/O

## Lab goal

Reinforce **Tasks**, **TaskGroup** and **gather** on the mock gateway. Build a "mini-dashboard": load the **health**, **json**, **slow** endpoints in parallel. Measure latency and handle a **random 503** on `/fail`.

## Prerequisites

- Completed [02-coroutines-await](02-coroutines-await.md), [05-tasks-taskgroup](05-tasks-taskgroup.md).
- The **8095** stand is up ([`deploy/python-async`](../../deploy/python-async/README.md)).
- venv with `httpx` ([`examples/requirements-lab.txt`](examples/requirements-lab.txt)).

```bash
curl -s http://localhost:8095/health
curl -s "http://localhost:8095/fail?rate=0.5"
```

---

## Task 1. Dashboard via asyncio.gather

**Why:** parallel independent GETs without TaskGroup.

`labs/06_dashboard_gather.py`:

```python
import asyncio
import time

import httpx

BASE = "http://localhost:8095"

async def fetch_path(client: httpx.AsyncClient, path: str) -> dict:
    r = await client.get(f"{BASE}{path}")
    r.raise_for_status()
    return r.json()

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        health, payload, slow = await asyncio.gather(
            fetch_path(client, "/health"),
            fetch_path(client, "/json?size=10"),
            fetch_path(client, "/slow?extra_ms=0"),
        )
    elapsed = time.perf_counter() - t0
    print(f"gather elapsed: {elapsed:.3f}s")
    print("health service:", health.get("service"))
    print("json items:", len(payload.get("items", [])))
    print("slow delay_ms:", slow.get("delay_ms"))

if __name__ == "__main__":
    asyncio.run(main())
```

**What you'll see:** elapsed ≈ the **max** of the delays (~200–350 ms), not the sum.

---

## Task 2. The same dashboard via TaskGroup

**Why:** structured concurrency, access to `.result()` after the block.

`labs/06_dashboard_taskgroup.py`:

```python
import asyncio
import time

import httpx

BASE = "http://localhost:8095"

async def fetch_path(client: httpx.AsyncClient, path: str) -> dict:
    r = await client.get(f"{BASE}{path}")
    r.raise_for_status()
    return r.json()

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        async with asyncio.TaskGroup() as tg:
            t_health = tg.create_task(fetch_path(client, "/health"))
            t_json = tg.create_task(fetch_path(client, "/json?size=10"))
            t_slow = tg.create_task(fetch_path(client, "/slow?extra_ms=50"))
    elapsed = time.perf_counter() - t0
    print(f"TaskGroup elapsed: {elapsed:.3f}s")
    print(t_health.result(), t_json.result()["items"][:3], t_slow.result()["delay_ms"])

if __name__ == "__main__":
    asyncio.run(main())
```

**What you'll see:** the time is comparable to gather (~250–400 ms).

---

## Task 3. create_task + staggered await

**Why:** schedule earlier, await later.

```python
async def staggered(client: httpx.AsyncClient):
    t0 = time.perf_counter()
    tasks = [
        asyncio.create_task(fetch_path(client, "/slow?extra_ms=0")),
        asyncio.create_task(fetch_path(client, "/slow?extra_ms=100")),
        asyncio.create_task(fetch_path(client, "/slow?extra_ms=200")),
    ]
    # all three are already running
    await asyncio.sleep(0.05)
    results = [await t for t in tasks]
    print(f"staggered: {time.perf_counter() - t0:.3f}s")
    return results
```

Call it from `main()` inside `async with httpx.AsyncClient`.

**What you'll see:** ~**300 ms** (max extra), not the 300+ sum.

---

## Task 4. Retry on /fail

**Why:** partial failure — a typical production case.

```python
import random

async def fetch_with_retry(
    client: httpx.AsyncClient,
    path: str,
    attempts: int = 5,
) -> dict:
    last_exc = None
    for i in range(attempts):
        try:
            r = await client.get(f"{BASE}{path}")
            r.raise_for_status()
            return r.json()
        except httpx.HTTPStatusError as e:
            last_exc = e
            await asyncio.sleep(0.05 * (i + 1))
    raise last_exc

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        data = await fetch_with_retry(client, "/fail?rate=0.7")
        print("success:", data)
```

**What you'll see:** sometimes success on the first try; sometimes after 2–3 retries; rarely an exception after 5 attempts.

---

## Task 5. ExceptionGroup (optional, 3.11+)

**Why:** the behavior of TaskGroup on an error.

```python
async def ok():
    return 1

async def boom():
    await asyncio.sleep(0.01)
    raise ValueError("fail")

async def demo_exception_group():
    try:
        async with asyncio.TaskGroup() as tg:
            tg.create_task(ok())
            tg.create_task(boom())
    except* ValueError as eg:
        print("caught:", eg.exceptions)
```

**What you'll see:** `ExceptionGroup` / `except*` catches the error from the child; the sibling **ok** was cancelled.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| gather/TaskGroup ~ sum of delays | the requests run **sequentially** — check for `await` inside the loop |
| 503 always | `/fail?rate=0.3` — lower the rate |
| TaskGroup AttributeError | Python < 3.11 — use only gather |
| httpx ConnectError | the stand isn't up |

---

## Success criteria

- [ ] gather dashboard is faster than the sequential one (~3×) from lab 03
- [ ] TaskGroup gives comparable time
- [ ] staggered create_task — max delay, not the sum
- [ ] retry on `/fail` sometimes succeeds
- [ ] You understand when TaskGroup cancels siblings

---

## Cleanup

Keep the `labs/06_*.py` files. No Redis/Postgres keys are used.

---

## Self-check questions

1. Why is elapsed ≈ max, not sum, in task 1?
2. What happens if one task in a TaskGroup raises without `except*`?
3. Why retry with backoff on `/fail`?
4. How does the gateway do a parallel aggregate? See [18-lab-parallel-fetch](18-lab-parallel-fetch.md).

Next lesson: [07. Cancellation and timeouts](07-cancellation-timeouts.md).
