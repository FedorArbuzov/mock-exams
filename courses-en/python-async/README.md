# Python — Asyncio (specialization)

In-depth course on **`asyncio`**: from **sync vs async** to **asyncpg**, **Redis asyncio**, **executors**, **pytest-asyncio**, and production patterns. **36 lessons**, **Middle** level, ~**18–24 hours**.

This is the **asyncio foundation**. The [`fastapi`](../fastapi/README.md) course covers applied API-level patterns — see [27-async-patterns](../fastapi/27-async-patterns.md) and [31-fastapi-bridge](31-fastapi-bridge.md).

**Prerequisites:** basic Python (functions, classes, exceptions, venv). Preferably [`fastapi`](../fastapi/README.md) chapters **01–06**, or in parallel.

**Locally:** [`deploy/python-async`](../../deploy/python-async/README.md) — mock HTTP gateway **`localhost:8095`**.

| Stand | When |
|-------|------|
| [`deploy/python-async`](../../deploy/python-async/README.md) | labs 03, 06, 08, 12, 15, 18, 35 |
| [`deploy/postgres`](../../deploy/postgres/README.md) | 19–20, 36 |
| [`deploy/redis`](../../deploy/redis/README.md) | 21–22, 36 |
| [`deploy/fastapi`](../../deploy/fastapi/README.md) | 31, 36 |

```bash
cd deploy/python-async
docker compose up -d --build
bash scripts/smoke.sh
```

Host dependencies: [`examples/requirements-lab.txt`](examples/requirements-lab.txt).

## How to read

1. **Theory** — scenario → tables → code → common mistakes → summary.
2. **Lab** — stand **8095** + venv with `httpx`.
3. After **33** — [`interview-cheatsheet.md`](interview-cheatsheet.md) without peeking.
4. [36-capstone.md](36-capstone.md) — **4–6 hours**.

**Time:** ~45–60 min per “theory + lab” pair; full course ~**18–24 h**.

## Curriculum (36 lessons)

### Phase 1. Landscape and coroutines (01–06)

| # | Lesson |
|---|--------|
| 01 | [Sync vs async](01-sync-vs-async.md) |
| 02 | [Coroutines and await](02-coroutines-await.md) |
| 03 | [Lab: first async script](03-lab-first-async.md) |
| 04 | [Event loop](04-event-loop.md) |
| 05 | [Tasks and TaskGroup](05-tasks-taskgroup.md) |
| 06 | [Lab: concurrent I/O](06-lab-concurrent-io.md) |

### Phase 2. Cancellation and data streams (07–12)

| 07 | [Cancellation and timeouts](07-cancellation-timeouts.md) |
| 08 | [Lab: graceful shutdown](08-lab-graceful-shutdown.md) |
| 09 | [gather vs TaskGroup](09-gather-vs-taskgroup.md) |
| 10 | [Async context managers](10-async-context-managers.md) |
| 11 | [Async generators](11-async-generators.md) |
| 12 | [Lab: streaming](12-lab-streaming.md) |

### Phase 3. Primitives and HTTP (13–18)

| 13 | [Lock, Semaphore, Event](13-primitives-locks.md) |
| 14 | [asyncio.Queue](14-asyncio-queues.md) |
| 15 | [Lab: worker pool](15-lab-worker-pool.md) |
| 16 | [Structured concurrency](16-structured-concurrency.md) |
| 17 | [Async HTTP: httpx](17-async-http-httpx.md) |
| 18 | [Lab: parallel fetch](18-lab-parallel-fetch.md) |

### Phase 4. DB, Redis, blocking (19–26)

| 19 | [asyncpg and SQLAlchemy async](19-asyncpg-database.md) |
| 20 | [Lab: async database](20-lab-async-database.md) |
| 21 | [Redis asyncio](21-redis-asyncio.md) |
| 22 | [Lab: async Redis](22-lab-redis-async.md) |
| 23 | [Executors and to_thread](23-executors-blocking.md) |
| 24 | [Lab: mixed workload](24-lab-mixed-workload.md) |
| 25 | [Subprocess and files](25-subprocess-files.md) |
| 26 | [When NOT async](26-when-not-async.md) |

### Phase 5. Tests and debugging (27–30)

| 27 | [pytest-asyncio](27-pytest-asyncio.md) |
| 28 | [Lab: async tests](28-lab-testing-async.md) |
| 29 | [Debug and profiling](29-debug-profiling.md) |
| 30 | [uvloop and production](30-uvloop-production.md) |

### Phase 6. Production and finale (31–36)

| 31 | [Bridge to FastAPI/Starlette](31-fastapi-bridge.md) |
| 32 | [Backpressure and Semaphore](32-backpressure-semaphores.md) |
| 33 | [Interview Q&A (top 30)](33-interview-qa.md) |
| 34 | [System design async](34-system-design-async.md) |
| 35 | [Lab: rate-limited fetcher](35-lab-rate-limited-fetcher.md) |
| 36 | [Capstone: async aggregator](36-capstone.md) |

### Cheatsheets and examples

| — | [Interview cheatsheet](interview-cheatsheet.md) |
| — | [examples/fetch_parallel.py](examples/fetch_parallel.py) |
| — | [examples/worker_pool.py](examples/worker_pool.py) |
| — | [examples/requirements-lab.txt](examples/requirements-lab.txt) |

## What you should end up with

- Explain **concurrency vs parallelism**; when to use asyncio, threads, or processes.
- Manage the **event loop**, **tasks**, **TaskGroup**, **cancellation**, **timeouts**.
- Use **Queue**, **Semaphore**, **httpx** for parallel I/O.
- Work with **asyncpg**, **redis.asyncio**, **executors** for blocking code.
- Test with **pytest-asyncio**; find loop blocking in debug mode.
- Connect asyncio to **FastAPI/uvicorn** and answer **interview Q&A**.

## Related courses

| Course | Relation |
|--------|----------|
| [`fastapi`](../fastapi/README.md) | ASGI API; chapter 27 — app-level async |
| [`redis-basic`](../redis-basic/README.md) | cache-aside, TTL |
| [`postgresql-basic`](../postgresql-basic/README.md) | SQL, pools |
| [`observability-basic`](../observability-basic/README.md) | latency, RED |
| [`messaging-deep`](../messaging-deep/README.md) | outbox, workers |
