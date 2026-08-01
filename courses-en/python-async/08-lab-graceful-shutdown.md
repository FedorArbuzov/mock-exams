# 08. Lab: graceful shutdown

## Lab goal

Write a mini-service with **long tasks** and proper **shutdown**: on **SIGINT/SIGTERM** cancel the tasks, wait for cleanup, close the **httpx** client. Simulate uvicorn's behavior on deploy.

## Prerequisites

- [07-cancellation-timeouts](07-cancellation-timeouts.md).
- The **8095** stand for "long" `/slow` requests.
- Python 3.11+.

```bash
pip install httpx
curl -s http://localhost:8095/health
```

---

## Task 1. A worker with an infinite loop

**Why:** a typical background consumer.

`labs/08_worker.py` (a fragment — finish the shutdown):

```python
import asyncio
import signal
from contextlib import asynccontextmanager

import httpx

BASE = "http://localhost:8095"
shutdown_event = asyncio.Event()

async def poll_once(client: httpx.AsyncClient, n: int) -> None:
    print(f"[{n}] start")
    try:
        r = await client.get(f"{BASE}/slow?extra_ms=200")
        r.raise_for_status()
        print(f"[{n}] ok delay={r.json().get('delay_ms')}")
    except asyncio.CancelledError:
        print(f"[{n}] cancelled — cleanup")
        raise

async def worker(client: httpx.AsyncClient, name: str):
    n = 0
    while not shutdown_event.is_set():
        n += 1
        try:
            async with asyncio.timeout(5.0):
                await poll_once(client, n)
        except TimeoutError:
            print(f"[{name}] timeout on iteration {n}")
        await asyncio.sleep(0.1)

async def main():
    async with httpx.AsyncClient(timeout=30.0) as client:
        tasks = [
            asyncio.create_task(worker(client, "A"), name="worker-A"),
            asyncio.create_task(worker(client, "B"), name="worker-B"),
        ]
        await shutdown_event.wait()
        print("shutting down...")
        for t in tasks:
            t.cancel()
        await asyncio.gather(*tasks, return_exceptions=True)
        print("done")

def request_shutdown():
    shutdown_event.set()

if __name__ == "__main__":
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, request_shutdown)
        except NotImplementedError:
            pass  # Windows: see task 3
    try:
        loop.run_until_complete(main())
    finally:
        loop.close()
```

**Run:** `python labs/08_worker.py`, after **5–10 s** press **Ctrl+C**.

**What you'll see:** `shutting down...`, `cancelled — cleanup` messages, `done`.

---

## Task 2. A timeout on a "hung" poll

**Why:** without `asyncio.timeout` one hung HTTP blocks cancel until the httpx timeout.

Change to `extra_ms=5000` and `asyncio.timeout(1.0)` — make sure the iteration finishes on **TimeoutError**, the loop stays responsive.

**What you'll see:** `[worker-A] timeout on iteration N` roughly every ~1 s, Ctrl+C still works quickly.

---

## Task 3. Windows: signal handler fallback

**Why:** `add_signal_handler` isn't available everywhere.

```python
# alternative for a Windows lab
import threading

def wait_keyboard():
    input("Press Enter to shutdown...\n")
    shutdown_event.set()

# in main() before await shutdown_event.wait():
threading.Thread(target=wait_keyboard, daemon=True).start()
```

**What you'll see:** Enter triggers the same shutdown path as SIGINT on Linux.

---

## Task 4. TaskGroup shutdown pattern

**Why:** a structured batch with cancel.

```python
async def run_batch(client: httpx.AsyncClient):
    try:
        async with asyncio.TaskGroup() as tg:
            for i in range(3):
                tg.create_task(poll_once(client, i))
    except* Exception as eg:
        print("errors:", eg.exceptions)
```

Run the batch, interrupt with **Ctrl+C** while it's running — the siblings should cancel.

---

## Task 5. Comparison with the gateway lifecycle

Open [`deploy/python-async/mock-server/app.py`](../../deploy/python-async/mock-server/app.py) — **`lifespan`** closes the `httpx.AsyncClient` when the container stops:

```bash
cd deploy/python-async
docker compose restart gateway
docker compose logs gateway --tail 20
```

**What you'll see:** a clean restart without leaked connections (at the process level).

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| Ctrl+C doesn't stop it | Windows — task 3; check the `CancelledError` re-raise |
| Worker doesn't exit | `gather(..., return_exceptions=True)` after cancel |
| Hang after shutdown | the httpx timeout is too large — reduce it |
| SIGTERM in Docker | `docker stop gateway` — grace period 10s |

---

## Success criteria

- [ ] Ctrl+C / Enter → `shutting down` → workers cancel
- [ ] `CancelledError` is not swallowed (re-raise in poll_once)
- [ ] `asyncio.timeout` interrupts a slow extra_ms=5000
- [ ] You understand the analogy with FastAPI lifespan + httpx
- [ ] The TaskGroup batch is interrupted on cancel

---

## Cleanup

Stop the script. You can keep the stand for the next labs.

---

## Self-check questions

1. Why `gather(..., return_exceptions=True)` after a mass cancel?
2. Why is a shutdown_event better than `while True` without a flag?
3. What does uvicorn do on SIGTERM with a running request?
4. How is the lifespan in the mock gateway related to this lab?

Next lesson: [09. gather vs TaskGroup](09-gather-vs-taskgroup.md).
