# 35. Lab: rate-limited fetcher

## Lab goal

Build a URL fetcher with **`asyncio.Semaphore`**, **retry with backoff**, **timeout**, and a metrics report. URL source — mock gateway **8095** and a static list of paths.

## Prerequisites

- [32-backpressure-semaphores](32-backpressure-semaphores.md), [17-async-http-httpx](17-async-http-httpx.md).
- Stand [`deploy/python-async`](../../deploy/python-async/README.md).
- `pip install httpx`

```bash
cd deploy/python-async && docker compose up -d
```

Reference: [`examples/fetch_parallel.py`](examples/fetch_parallel.py).

---

## Task 1. Target list

```python
PATHS = [
    "/health",
    "/json?size=5",
    "/json?size=10",
    "/slow?extra_ms=0",
    "/slow?extra_ms=50",
    "/slow?extra_ms=100",
    "/fail?rate=0.3",
] * 3  # 21 request
BASE = "http://localhost:8095"
CONCURRENCY = 5
```

---

## Task 2. Fetch with semaphore + timeout

`labs/35_fetcher.py`:

```python
import asyncio
import time
from dataclasses import dataclass

import httpx

@dataclass
class FetchResult:
    url: str
    status: int | None
    latency_ms: float
    error: str | None = None

async def fetch_one(
    sem: asyncio.Semaphore,
    client: httpx.AsyncClient,
    path: str,
    attempts: int = 3,
) -> FetchResult:
    url = f"{BASE}{path}"
    async with sem:
        last_err = None
        for i in range(attempts):
            t0 = time.perf_counter()
            try:
                async with asyncio.timeout(10.0):
                    r = await client.get(url)
                latency = (time.perf_counter() - t0) * 1000
                if r.status_code >= 500:
                    last_err = f"HTTP {r.status_code}"
                    await asyncio.sleep(0.05 * (2 ** i))
                    continue
                return FetchResult(url, r.status_code, latency)
            except (TimeoutError, httpx.HTTPError) as e:
                last_err = str(e)
                await asyncio.sleep(0.05 * (2 ** i))
        return FetchResult(url, None, 0.0, last_err)
```

---

## Task 3. Parallel run + summary

```python
async def run_fetcher(paths: list[str]) -> list[FetchResult]:
    sem = asyncio.Semaphore(CONCURRENCY)
    async with httpx.AsyncClient(timeout=30.0) as client:
        return await asyncio.gather(*[
            fetch_one(sem, client, p) for p in paths
        ])

def summarize(results: list[FetchResult]) -> None:
    ok = [r for r in results if r.error is None]
    fail = [r for r in results if r.error]
    latencies = [r.latency_ms for r in ok]
    print(f"ok={len(ok)} fail={len(fail)}")
    if latencies:
        print(f"latency ms: min={min(latencies):.0f} p50={sorted(latencies)[len(latencies)//2]:.0f} max={max(latencies):.0f}")

async def main():
    t0 = time.perf_counter()
    results = await run_fetcher(PATHS)
    summarize(results)
    print(f"wall-clock: {(time.perf_counter()-t0)*1000:.0f}ms")

if __name__ == "__main__":
    asyncio.run(main())
```

**Run:** `python labs/35_fetcher.py`

**What you should see:** `ok` ≈ 18–21 (random fail on `/fail`); wall-clock **less** than the sum of all slow, more than one slow — because of sem=5.

---

## Task 4. Compare concurrency 1 vs 10

```python
async def benchmark_concurrency():
    for n in (1, 5, 10):
        global CONCURRENCY
        CONCURRENCY = n
        t0 = time.perf_counter()
        await run_fetcher(PATHS[:9])
        print(f"concurrency={n} elapsed={(time.perf_counter()-t0)*1000:.0f}ms")
```

**What you should see:** raising n cuts elapsed until a plateau (upstream/latency bound).

---

## Task 5. Write to Postgres (optional)

Wire up insert from [20-lab-async-database](20-lab-async-database.md) — one row per `FetchResult` in `fetch_log`.

---

## Task 6. Semaphore test

```python
@pytest.mark.asyncio
async def test_semaphore_limits_parallelism():
    max_active = 0
    active = 0
    sem = asyncio.Semaphore(2)
    lock = asyncio.Lock()

    async def worker():
        nonlocal active, max_active
        async with sem:
            async with lock:
                active += 1
                max_active = max(max_active, active)
            await asyncio.sleep(0.05)
            async with lock:
                active -= 1

    await asyncio.gather(*[worker() for _ in range(6)])
    assert max_active <= 2
```

---

## If it doesn't work

| Symptom | Action |
|---------|--------|
| All fail | gateway down; `curl localhost:8095/health` |
| elapsed ≈ sum | semaphore not used in fetch_one |
| Many TimeoutError | raise timeout or lower CONCURRENCY |
| 21 fail on /fail | some fail expected; retry should help |

---

## Success criteria

- [ ] Semaphore limits in-flight (test or logs)
- [ ] Retry saves some `/fail` requests
- [ ] Summary prints ok/fail and latency stats
- [ ] concurrency 10 faster than 1 on 9 slow paths
- [ ] You understand the link to gateway `/aggregate-parallel`

---

## Cleanup

Keep the script for the capstone.

---

## Self-check questions

1. Why does a semaphore inside the retry loop hold the slot longer?
2. How would you add a global rate limit across processes?
3. What changes with 10,000 URLs?
4. Which parts go into [36-capstone](36-capstone.md)?

Next lesson: [36. Capstone](36-capstone.md).
