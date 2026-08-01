# 03. Lab: your first async script

## Lab goal

Create a **venv**, install **httpx**, write your first **`asyncio.run`** script. Compare **sequential** and **parallel** requests to the mock gateway on **`localhost:8095`**. Record the wall-clock difference.

## Prerequisites

- Python **3.11+** (3.12 recommended).
- Docker: the [`deploy/python-async`](../../deploy/python-async/README.md) stand.

```bash
cd deploy/python-async
docker compose up -d --build
docker compose ps
curl -s http://localhost:8095/health
```

Expect `{"service":"gateway","status":"ok"}` (or similar). Smoke:

```bash
bash scripts/smoke.sh
# Windows: .\scripts\smoke.ps1
```

The working folder for the scripts is any; below is `courses/python-async/labs/` (create it yourself).

```bash
cd courses/python-async
python -m venv .venv
# Linux/macOS: source .venv/bin/activate
# Windows: .\.venv\Scripts\Activate.ps1
pip install -r examples/requirements-lab.txt
```

---

## Task 1. Sync baseline (urllib)

**Why:** a numeric baseline before async.

Create `labs/01_sync_baseline.py`:

```python
import time
import urllib.request

BASE = "http://localhost:8095"
URLS = [
    f"{BASE}/slow?extra_ms=0",
    f"{BASE}/slow?extra_ms=50",
    f"{BASE}/slow?extra_ms=100",
]

def fetch(url: str) -> None:
    with urllib.request.urlopen(url, timeout=30) as r:
        r.read()

def main():
    t0 = time.perf_counter()
    for url in URLS:
        fetch(url)
    print(f"sync sequential: {time.perf_counter() - t0:.3f}s")

if __name__ == "__main__":
    main()
```

```bash
python labs/01_sync_baseline.py
```

**What you'll see:** ~**0.75–1.0 s** (the sum of delays ~200+250+300 ms + network).

**If Connection refused:** `docker compose ps`, port **8095** is free.

---

## Task 2. Async sequential

**Why:** the same URL order, but with `async`/`await`.

`labs/02_async_sequential.py`:

```python
import asyncio
import time

import httpx

BASE = "http://localhost:8095"
URLS = [
    f"{BASE}/slow?extra_ms=0",
    f"{BASE}/slow?extra_ms=50",
    f"{BASE}/slow?extra_ms=100",
]

async def fetch(client: httpx.AsyncClient, url: str) -> None:
    r = await client.get(url)
    r.raise_for_status()

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        for url in URLS:
            await fetch(client, url)
    print(f"async sequential: {time.perf_counter() - t0:.3f}s")

if __name__ == "__main__":
    asyncio.run(main())
```

**What you'll see:** the time **≈ sync sequential** — async without parallelism gives no speedup.

---

## Task 3. Async parallel (gather)

**Why:** concurrent I/O — the main win of asyncio.

`labs/03_async_parallel.py`:

```python
import asyncio
import time

import httpx

BASE = "http://localhost:8095"
URLS = [
    f"{BASE}/slow?extra_ms=0",
    f"{BASE}/slow?extra_ms=50",
    f"{BASE}/slow?extra_ms=100",
]

async def fetch(client: httpx.AsyncClient, url: str) -> dict:
    r = await client.get(url)
    r.raise_for_status()
    return r.json()

async def main():
    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=30.0) as client:
        results = await asyncio.gather(*(fetch(client, u) for u in URLS))
    elapsed = time.perf_counter() - t0
    print(f"async parallel: {elapsed:.3f}s")
    print("delays:", [x.get("delay_ms") for x in results])

if __name__ == "__main__":
    asyncio.run(main())
```

**What you'll see:** ~**0.35–0.45 s** — close to **max(delay)**, not the sum.

---

## Task 4. Checking aggregate on the gateway

**Why:** to see the same pattern "as in a production gateway".

```bash
curl -s -w "\ntotal:%{time_total}s\n" http://localhost:8095/aggregate
curl -s -w "\ntotal:%{time_total}s\n" http://localhost:8095/aggregate-parallel
```

**What you'll see:** sequential ~**1 s**, parallel ~**0.5 s** (depends on the upstream BASE_DELAY_MS).

---

## Task 5. A deliberate mistake (optional)

**Why:** to reinforce the "coroutine was never awaited" warning.

```python
async def broken():
    async with httpx.AsyncClient() as client:
        client.get("http://localhost:8095/health")  # forgot await!

asyncio.run(broken())
```

**What you'll see:** `RuntimeWarning: coroutine 'AsyncClient.get' was never awaited`.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| `8095` refused | `cd deploy/python-async && docker compose up -d --build` |
| aggregate 502 | wait for all services to be **healthy** (`docker compose ps`) |
| SSL errors | use `http://`, not `https://` |
| Very slow | check VPN/proxy; `httpx` uses no proxy by default |
| Windows firewall | allow Docker Desktop |

More: [`deploy/python-async/README.md`](../../deploy/python-async/README.md).

---

## Success criteria

- [ ] venv created, `httpx` installed
- [ ] sync sequential ~ the sum of delays
- [ ] async sequential ≈ sync (not faster)
- [ ] async parallel ≈ max of the delays (significantly faster)
- [ ] `/aggregate` slower than `/aggregate-parallel` on curl
- [ ] It's clear why `await` on `client.get` is needed

---

## Cleanup

You can keep the scripts in `labs/` for diffing. The stand:

```bash
cd deploy/python-async
docker compose down   # without -v if other courses use the images
```

---

## Self-check questions

1. Why is async sequential not faster than sync?
2. What does `asyncio.gather` do in task 3?
3. Why `async with httpx.AsyncClient`?
4. How does the gateway implement `/aggregate-parallel`? (hint: [`app.py`](../../deploy/python-async/mock-server/app.py))

Next lesson: [04. Event loop](04-event-loop.md).
