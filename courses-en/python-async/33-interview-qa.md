# 33. Top 30 asyncio interview Q&A

Prep for a **Middle+ Python** interview. Answers are expanded, with course references. Cheatsheet — [interview-cheatsheet](interview-cheatsheet.md).

---

## 1. How does concurrency differ from parallelism?

**Concurrency** — several tasks make progress over a period of time by switching (often on I/O wait). **Parallelism** — tasks run at the same time on different cores. Asyncio in one process is concurrency; multiprocessing is parallelism for CPU. See [01-sync-vs-async](01-sync-vs-async.md).

---

## 2. What is an event loop?

A cycle that schedules coroutines/tasks, runs ready callbacks, and waits for I/O via a selector. `asyncio.run()` creates a loop, runs the main coroutine, and closes the loop. See [04-event-loop](04-event-loop.md).

---

## 3. Coroutine vs Task vs Future?

**Coroutine** — an `async def` object; it does not run without await/schedule. **Task** — a coroutine wrapped by the loop for concurrent execution (`create_task`). **Future** — a low-level placeholder for a result (usually inside asyncio, rarely in app code).

---

## 4. What does `await` do?

Suspends the current coroutine, yields control to the loop, and subscribes to completion of the awaitable. When ready — continues from the same stack frame. Does not create a new thread.

---

## 5. When is asyncio appropriate?

When you have many **I/O-bound** operations with long waits (HTTP, DB, Redis, websockets) and need high concurrency in **one process** with an async stack. Not for CPU-bound work without offload. [26-when-not-async](26-when-not-async.md).

---

## 6. Why is `time.sleep` dangerous in async?

It blocks the **entire** event-loop thread — all coroutines freeze. Use `asyncio.sleep` for a cooperative yield, or `asyncio.to_thread(time.sleep, n)` to simulate blocking in tests. [23-executors-blocking](23-executors-blocking.md).

---

## 7. `asyncio.gather` vs `TaskGroup`?

`gather` — classic, optional `return_exceptions`. `TaskGroup` (3.11+) — structured concurrency: leaving `async with` guarantees children finish; on error — cancel siblings + `ExceptionGroup`. [05-tasks-taskgroup](05-tasks-taskgroup.md), [09-gather-vs-taskgroup](09-gather-vs-taskgroup.md).

---

## 8. How does cancellation work?

`task.cancel()` → on the next `await` in the target coroutine raises `CancelledError`. The coroutine must re-raise after cleanup. `asyncio.timeout()` cancels the scope. [07-cancellation-timeouts](07-cancellation-timeouts.md).

---

## 9. What is structured concurrency?

Rule: child task lifetimes are **nested** in the parent scope — no “dangling” fire-and-forget without control. TaskGroup and trio are examples. [16-structured-concurrency](16-structured-concurrency.md).

---

## 10. Why `asyncio.Semaphore`?

Limits the number of simultaneous operations (HTTP, DB) — **in-process backpressure**. Without a limit — OOM and cascade failure upstream. [32-backpressure-semaphores](32-backpressure-semaphores.md).

---

## 11. Lock vs Semaphore?

**Lock** — one owner. **Semaphore(N)** — up to N owners. Lock for mutual exclusion; Semaphore for pool slots.

---

## 12. How do you test async code?

`pytest-asyncio`, `async` fixtures, `AsyncMock`, test timeouts. Integration — env flag + Docker stands. [27-pytest-asyncio](27-pytest-asyncio.md).

---

## 13. `asyncio.to_thread` vs `run_in_executor`?

`to_thread` — sugar over the default thread pool. `run_in_executor` — any executor, including ProcessPool. [23-executors-blocking](23-executors-blocking.md).

---

## 14. When ProcessPool instead of threads?

CPU-bound work (hash, image, pandas chunk) — GIL blocks threads. ProcessPool bypasses the GIL at the cost of IPC/pickle overhead.

---

## 15. How does asyncpg differ from psycopg2?

asyncpg — native async PostgreSQL protocol; does not block the loop. SQLAlchemy: `postgresql+asyncpg://` + `create_async_engine`. [19-asyncpg-database](19-asyncpg-database.md).

---

## 16. How do you size a DB pool with uvicorn workers?

`workers × (pool_size + max_overflow) ≤ max_connections`. Each worker has a separate pool. [30-uvloop-production](30-uvloop-production.md).

---

## 17. redis.asyncio vs sync redis?

In `async def`, a sync client blocks the loop. redis-py 5.x: `import redis.asyncio as redis`, `await client.get()`, `await client.aclose()`. [21-redis-asyncio](21-redis-asyncio.md).

---

## 18. Cache-aside in async?

GET Redis → miss → await DB → SETEX Redis. Invalidate on write. Don’t hold a DB session during a Redis await (and vice versa) without need. [22-lab-redis-async](22-lab-redis-async.md).

---

## 19. What is uvloop?

A fast event-loop implementation on libuv (Linux/macOS). Speeds up I/O scheduling; does not remove blocking Python code.

---

## 20. How many event loops with `--workers 4`?

**Four** (one per process). Coroutines do not migrate between workers. Shared state — Redis/DB, not process memory.

---

## 21. `async def` vs `def` in FastAPI?

`async def` — coroutine on the loop. `def` — Starlette runs it in a threadpool (does not block the loop). `async def` + sync blocking — worst antipattern. [31-fastapi-bridge](31-fastapi-bridge.md).

---

## 22. What is a slow callback warning?

With `debug=True`, the loop logs if a callback/coroutine section took > `slow_callback_duration` (default 0.1s). A signal of blocking code. [29-debug-profiling](29-debug-profiling.md).

---

## 23. How do you do graceful shutdown in asyncio?

SIGTERM → stop accept → cancel background tasks → `gather` with cleanup → close httpx/redis/engine. `asyncio.Event` or lifespan. [08-lab-graceful-shutdown](08-lab-graceful-shutdown.md).

---

## 24. Fire-and-forget task — what’s the danger?

The task may not finish before process exit; exceptions are lost without a callback. Prefer TaskGroup, a background queue, or an explicit task registry.

---

## 25. What is backpressure?

A mechanism that slows the producer when the consumer cannot keep up: Queue maxsize, Semaphore, TCP windows, 429. Without it — memory and latency grow. [34-system-design-async](34-system-design-async.md).

---

## 26. Fan-out pattern?

One request starts N parallel downstream calls (`gather`/TaskGroup) and aggregates results. Needs a semaphore + timeout per call. Gateway 8095 `/aggregate-parallel`. [18-lab-parallel-fetch](18-lab-parallel-fetch.md).

---

## 27. Circuit breaker (briefly)?

When upstream errors rise — “open the circuit”, fail fast, periodically try recovery. Libraries: tenacity + custom breaker; not built into stdlib asyncio.

---

## 28. ExceptionGroup in 3.11?

Multiple exceptions from TaskGroup/gather. Caught with `except* ValueError`. Tests: `pytest.raises(ExceptionGroup)`.

---

## 29. How do you debug a “hung” async service?

`asyncio.all_tasks()`, debug mode, py-spy, logs on await boundaries, check pool exhaustion and Lock deadlock. [29-debug-profiling](29-debug-profiling.md).

---

## 30. Typical capstone async microservice?

Async edge (FastAPI) → semaphore-limited httpx fan-out → parse → asyncpg write → Redis cache metrics. pytest-asyncio tests, deploy compose. [36-capstone](36-capstone.md).

---

## How to prepare

1. Complete labs **06, 18, 20, 22, 35**.
2. Explain **cancellation** and **pool sizing** out loud.
3. Draw a diagram: client → API → N upstream + PG + Redis.
4. Review [interview-cheatsheet](interview-cheatsheet.md) for 15 minutes before the interview.

Next lesson: [34. System design async](34-system-design-async.md).
