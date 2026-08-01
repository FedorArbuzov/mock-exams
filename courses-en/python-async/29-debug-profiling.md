# 29. Debug mode, slow callback, and profiling

## Intro: “production is slow, but the profiler is silent”

Async bugs **don't reproduce** under load: one coroutine blocks the loop for 200 ms — p99 spikes, the stack trace shows only `await`. You need **asyncio debug mode**, **slow callback** warnings, and **profiling** tools for the event loop.

Related: [28-lab-testing-async](28-lab-testing-async.md), production tuning — [30-uvloop-production](30-uvloop-production.md).

## What you'll learn

- **`PYTHONASYNCIODEBUG`**, `loop.set_debug(True)`.
- **Slow callback** warnings (> 100 ms by default).
- **`asyncio.all_tasks`**, diagnosing hung coroutines.
- Profiling: `yappi`, `py-spy`, logging task names.

---

## Debug mode

```python
import asyncio
import os

async def main():
    ...

# Method 1: env
# PYTHONASYNCIODEBUG=1 python app.py

# Method 2: explicitly
asyncio.run(main(), debug=True)  # Python 3.11+
```

| Effect of debug=True | |
|----------------------|---|
| Check for unawaited coroutines | Warning on GC |
| Long `loop.slow_callback_duration` | Log slow callbacks |
| Cancelled tasks | More detailed traceback |

Do **not** leave `debug=True` on permanently in production — bookkeeping overhead.

---

## Slow callback

```python
import asyncio
import time

async def main():
    loop = asyncio.get_running_loop()
    loop.slow_callback_duration = 0.05  # 50 ms threshold

    def blocking_callback():
        time.sleep(0.2)  # simulate sync in a callback

    loop.call_soon(blocking_callback)
    await asyncio.sleep(0.5)

asyncio.run(main(), debug=True)
```

Output (with debug):

```
Executing <Handle ...> took 0.2 seconds
```

**Source:** not only `call_soon`, but also **blocking** between awaits — effectively any sync CPU in a coroutine.

---

## Finding hung tasks

```python
import asyncio

async def watchdog(interval: float = 5.0):
    while True:
        await asyncio.sleep(interval)
        tasks = asyncio.all_tasks()
        for t in tasks:
            if t.get_name().startswith("worker-"):
                print(t.get_name(), t.done(), t.get_coro())

async def main():
    asyncio.create_task(watchdog(), name="watchdog")
    # ... your service
```

In Python 3.11+ `Task.get_stack()` is limited — use **logging** on coroutine entry/exit.

---

## Task naming

```python
async def fetch_item(n: int):
    ...

task = asyncio.create_task(fetch_item(1), name=f"fetch-{n}")
```

Names show up in logs and `asyncio.all_tasks()` — invaluable during an incident.

---

## Profiling

### py-spy (production-safe sampling)

```bash
pip install py-spy
py-spy top --pid <uvicorn-pid>
py-spy record -o profile.svg --pid <pid> --duration 30
```

No instrumentation required; sees **where** CPU goes, including C extensions.

### yappi (async-aware)

```bash
pip install yappi
```

```python
import yappi
import asyncio

async def workload():
    ...

yappi.set_clock_type("wall")
yappi.start()
asyncio.run(workload())
yappi.stop()
yappi.get_func_stats().print_all()
```

Filter by `await` time vs CPU time — look for functions without await that have high wall time.

---

## Logging await boundaries

```python
import logging
import time

log = logging.getLogger(__name__)

async def traced_fetch(name: str, coro):
    t0 = time.perf_counter()
    log.info("start %s", name)
    try:
        return await coro
    finally:
        log.info("done %s in %.3fs", name, time.perf_counter() - t0)
```

Structured logs + trace_id — tie a slow request to a specific coroutine.

---

## Typical symptoms and diagnosis

| Symptom | Likely cause | Tool |
|---------|--------------|------|
| p99 ↑, CPU low | blocking I/O in async | debug slow callback |
| Everything hung | Lock/Semaphore deadlock | all_tasks dump |
| Memory leak | tasks never awaited | debug unawaited |
| One endpoint slow | sync ORM / pandas | py-spy flamegraph |
| Worse after deploy | pool exhaustion | pg_stat_activity, redis INFO |

---

## On stand 8095

```python
import asyncio
import time
import httpx

async def poison():
    time.sleep(0.3)

async def probe():
    async with httpx.AsyncClient() as c:
        async with asyncio.timeout(2.0):
            await c.get("http://localhost:8095/health")

async def demo():
    asyncio.create_task(poison(), name="poison")
    await probe()  # delayed ~300ms with debug

asyncio.run(demo(), debug=True)
```

Remove `poison` — probe is fast again. That is how you reproduce “one bad neighbor”.

---

## In production

- **Short-lived** debug during investigation, not 24/7.
- **OpenTelemetry** spans on every HTTP/DB await ([deploy/observability](../../deploy/observability/README.md)).
- Alert on **event loop lag** (uvicorn + custom metric).
- Runbook: “slow callback” → grep blocking imports.

---

## Summary

**Debug mode** and **slow callback warnings** are the first line of defense against loop blocking. **py-spy/yappi** are the second. **Named tasks** and **structured logs** connect the symptom to the code.

## Checklist

- How do you enable asyncio debug?
- What does “Executing Handle took 0.2 seconds” mean?
- How do you list all running tasks?
- Why is debug=True not for permanent production?

Next lesson: [30. uvloop and production](30-uvloop-production.md).
