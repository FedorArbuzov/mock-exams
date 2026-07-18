# Python — Asyncio (специализация)

Углублённый курс по **`asyncio`**: от **sync vs async** до **asyncpg**, **Redis asyncio**, **executors**, **pytest-asyncio** и production-паттернов. **36 уроков**, уровень **Middle**, ~**18–24 часа**.

Это **фундамент asyncio**. Курс [`fastapi`](../fastapi/README.md) даёт прикладные паттерны на уровне API — см. [27-async-patterns](../fastapi/27-async-patterns.md) и [31-fastapi-bridge](31-fastapi-bridge.md).

**Предварительно:** базовый Python (функции, классы, исключения, venv). Желательно [`fastapi`](../fastapi/README.md) главы **01–06** или параллельно.

**Локально:** [`deploy/python-async`](../../deploy/python-async/README.md) — mock HTTP gateway **`localhost:8095`**.

| Стенд | Когда |
|-------|-------|
| [`deploy/python-async`](../../deploy/python-async/README.md) | лабы 03, 06, 08, 12, 15, 18, 35 |
| [`deploy/postgres`](../../deploy/postgres/README.md) | 19–20, 36 |
| [`deploy/redis`](../../deploy/redis/README.md) | 21–22, 36 |
| [`deploy/fastapi`](../../deploy/fastapi/README.md) | 31, 36 |

```bash
cd deploy/python-async
docker compose up -d --build
bash scripts/smoke.sh
```

Зависимости на хосте: [`examples/requirements-lab.txt`](examples/requirements-lab.txt).

## Как читать

1. **Теория** — сценарий → таблицы → код → типичные ошибки → резюме.
2. **Лаба** — стенд **8095** + venv с `httpx`.
3. После **33** — [`interview-cheatsheet.md`](interview-cheatsheet.md) без подглядывания.
4. [36-capstone.md](36-capstone.md) — **4–6 часов**.

**Время:** ~45–60 мин на пару «теория + лаба»; весь курс ~**18–24 ч**.

## Программа (36 уроков)

### Фаза 1. Ландшафт и корутины (01–06)

| # | Урок |
|---|------|
| 01 | [Sync vs async](01-sync-vs-async.md) |
| 02 | [Корутины и await](02-coroutines-await.md) |
| 03 | [Лаба: первый async-скрипт](03-lab-first-async.md) |
| 04 | [Event loop](04-event-loop.md) |
| 05 | [Tasks и TaskGroup](05-tasks-taskgroup.md) |
| 06 | [Лаба: concurrent I/O](06-lab-concurrent-io.md) |

### Фаза 2. Отмена и потоки данных (07–12)

| 07 | [Cancellation и timeouts](07-cancellation-timeouts.md) |
| 08 | [Лаба: graceful shutdown](08-lab-graceful-shutdown.md) |
| 09 | [gather vs TaskGroup](09-gather-vs-taskgroup.md) |
| 10 | [Async context managers](10-async-context-managers.md) |
| 11 | [Async generators](11-async-generators.md) |
| 12 | [Лаба: streaming](12-lab-streaming.md) |

### Фаза 3. Примитивы и HTTP (13–18)

| 13 | [Lock, Semaphore, Event](13-primitives-locks.md) |
| 14 | [asyncio.Queue](14-asyncio-queues.md) |
| 15 | [Лаба: worker pool](15-lab-worker-pool.md) |
| 16 | [Structured concurrency](16-structured-concurrency.md) |
| 17 | [Async HTTP: httpx](17-async-http-httpx.md) |
| 18 | [Лаба: parallel fetch](18-lab-parallel-fetch.md) |

### Фаза 4. БД, Redis, blocking (19–26)

| 19 | [asyncpg и SQLAlchemy async](19-asyncpg-database.md) |
| 20 | [Лаба: async database](20-lab-async-database.md) |
| 21 | [Redis asyncio](21-redis-asyncio.md) |
| 22 | [Лаба: async Redis](22-lab-redis-async.md) |
| 23 | [Executors и to_thread](23-executors-blocking.md) |
| 24 | [Лаба: mixed workload](24-lab-mixed-workload.md) |
| 25 | [Subprocess и файлы](25-subprocess-files.md) |
| 26 | [Когда НЕ async](26-when-not-async.md) |

### Фаза 5. Тесты и отладка (27–30)

| 27 | [pytest-asyncio](27-pytest-asyncio.md) |
| 28 | [Лаба: тесты async](28-lab-testing-async.md) |
| 29 | [Debug и profiling](29-debug-profiling.md) |
| 30 | [uvloop и production](30-uvloop-production.md) |

### Фаза 6. Production и финал (31–36)

| 31 | [Мост к FastAPI/Starlette](31-fastapi-bridge.md) |
| 32 | [Backpressure и Semaphore](32-backpressure-semaphores.md) |
| 33 | [Interview Q&A (топ-30)](33-interview-qa.md) |
| 34 | [System design async](34-system-design-async.md) |
| 35 | [Лаба: rate-limited fetcher](35-lab-rate-limited-fetcher.md) |
| 36 | [Capstone: async aggregator](36-capstone.md) |

### Шпаргалки и примеры

| — | [Interview cheatsheet](interview-cheatsheet.md) |
| — | [examples/fetch_parallel.py](examples/fetch_parallel.py) |
| — | [examples/worker_pool.py](examples/worker_pool.py) |
| — | [examples/requirements-lab.txt](examples/requirements-lab.txt) |

## Что должно получиться

- Объясняете **concurrency vs parallelism**; когда asyncio, threads или processes.
- Управляете **event loop**, **tasks**, **TaskGroup**, **cancellation**, **timeouts**.
- Используете **Queue**, **Semaphore**, **httpx** для parallel I/O.
- Работаете с **asyncpg**, **redis.asyncio**, **executors** для blocking кода.
- Тестируете через **pytest-asyncio**; находите блокировки loop в debug mode.
- Связываете asyncio с **FastAPI/uvicorn** и отвечаете на **interview Q&A**.

## Связь с курсами

| Курс | Связь |
|------|-------|
| [`fastapi`](../fastapi/README.md) | ASGI API; глава 27 — app-level async |
| [`redis-basic`](../redis-basic/README.md) | cache-aside, TTL |
| [`postgresql-basic`](../postgresql-basic/README.md) | SQL, пулы |
| [`observability-basic`](../observability-basic/README.md) | latency, RED |
| [`messaging-deep`](../messaging-deep/README.md) | outbox, workers |
