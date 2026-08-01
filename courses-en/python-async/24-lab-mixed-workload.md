# 24. Lab: mixed CPU + I/O workload

## Lab goal

Build a pipeline: **parallel HTTP** (8095) + **CPU hash** in a ProcessPool + a **write** to Postgres. Compare three variants: CPU in the loop (bad), `to_thread`, `ProcessPoolExecutor`.

## Prerequisites

- [23-executors-blocking](23-executors-blocking.md), [18-lab-parallel-fetch](18-lab-parallel-fetch.md).
- Stands: **8095**, [`deploy/postgres`](../../deploy/postgres/README.md).
- `pip install httpx sqlalchemy asyncpg`

```bash
cd deploy/python-async && docker compose up -d
cd deploy/postgres && docker compose up -d
```

---

## Task 1. CPU worker

```python
import hashlib

def compute_digest(payload: bytes, rounds: int = 50_000) -> str:
    h = hashlib.sha256()
    for i in range(rounds):
        h.update(payload)
        h.update(str(i).encode())
    return h.hexdigest()
```

---

## Task 2. Fetch + process pipeline

`labs/24_mixed.py`:

```python
import asyncio
import time
from concurrent.futures import ProcessPoolExecutor

import httpx
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

BASE = "http://localhost:8095"
DATABASE_URL = "postgresql+asyncpg://course:course@localhost:5432/course"

engine = create_async_engine(DATABASE_URL, pool_size=5)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

PATHS = ["/json?size=20", "/json?size=30", "/slow?extra_ms=0"]

async def fetch_one(client: httpx.AsyncClient, path: str) -> bytes:
    r = await client.get(f"{BASE}{path}")
    r.raise_for_status()
    return r.content

async def save_digest(digest: str, path: str) -> None:
    async with SessionLocal() as session:
        await session.execute(
            text("INSERT INTO fetch_log (url, status_code, latency_ms) VALUES (:u, 200, 0)"),
            {"u": f"digest:{path}:{digest[:8]}"},
        )
        await session.commit()
```

---

## Task 3. Variant A — CPU in the loop (anti-pattern)

```python
async def pipeline_blocking_cpu(client: httpx.AsyncClient) -> float:
    t0 = time.perf_counter()
    for path in PATHS:
        data = await fetch_one(client, path)
        digest = compute_digest(data)  # blocks the loop!
        await save_digest(digest, path)
    return time.perf_counter() - t0
```

Run it and measure. A parallel health-check during the pipeline **will be delayed**.

---

## Task 4. Variant B — asyncio.to_thread

```python
async def pipeline_thread(client: httpx.AsyncClient) -> float:
    t0 = time.perf_counter()
    for path in PATHS:
        data = await fetch_one(client, path)
        digest = await asyncio.to_thread(compute_digest, data)
        await save_digest(digest, path)
    return time.perf_counter() - t0
```

**What you'll see:** HTTP concurrent with the background probe; the CPU offload doesn't freeze the loop.

---

## Task 5. Variant C — ProcessPool + gather

```python
async def pipeline_process(client: httpx.AsyncClient) -> float:
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as c:
        payloads = await asyncio.gather(*[fetch_one(c, p) for p in PATHS])

    loop = asyncio.get_running_loop()
    with ProcessPoolExecutor(max_workers=2) as pool:
        digests = await asyncio.gather(*[
            loop.run_in_executor(pool, compute_digest, p) for p in payloads
        ])

    await asyncio.gather(*[
        save_digest(d, p) for d, p in zip(digests, PATHS)
    ])
    return time.perf_counter() - t0
```

**What you'll see:** the fetch phase ≈ max latency; the CPU phase is parallel across 2 workers.

---

## Task 6. Probe: loop responsiveness

```python
async def probe_loop(client: httpx.AsyncClient, stop: asyncio.Event):
    while not stop.is_set():
        t0 = time.perf_counter()
        await client.get(f"{BASE}/health")
        print(f"probe latency: {(time.perf_counter()-t0)*1000:.0f}ms")
        await asyncio.sleep(0.2)

async def compare():
    stop = asyncio.Event()
    async with httpx.AsyncClient(timeout=30.0) as client:
        probe = asyncio.create_task(probe_loop(client, stop))
        print("blocking:", await pipeline_blocking_cpu(client))
        stop.set()
        await probe

if __name__ == "__main__":
    asyncio.run(compare())
```

**What you'll see:** with blocking CPU the probe jumps to **hundreds of ms**; with to_thread — steadily low.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| ProcessPool pickle error | `if __name__ == "__main__"` guard |
| Windows spawn slow | reduce `rounds` in compute_digest |
| Postgres connection error | lab 20 schema |
| 8095 down | deploy/python-async smoke |

---

## Success criteria

- [ ] Three variants measured (time printed)
- [ ] The probe shows a freeze on blocking CPU
- [ ] ProcessPool is faster than sequential CPU on 3 payloads
- [ ] Digests are written to fetch_log
- [ ] You understand the thread vs process trade-off

---

## Cleanup

Keep the stands for the next labs.

---

## Self-check questions

1. Why is a gather fetch before the process pool faster than a for loop?
2. How many process workers are optimal on a 4-core laptop?
3. When is to_thread enough instead of a ProcessPool?
4. How does this carry over to FastAPI? [31-fastapi-bridge](31-fastapi-bridge.md)

Next lesson: [25. Subprocess and files](25-subprocess-files.md).
