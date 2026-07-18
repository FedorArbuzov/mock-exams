# 33. Top 30 asyncio interview Q&A

Подготовка к собеседованию **Middle+ Python**. Ответы развёрнутые, с отсылками к курсу. Шпаргалка — [interview-cheatsheet](interview-cheatsheet.md).

---

## 1. Чем concurrency отличается от parallelism?

**Concurrency** — несколько задач продвигаются за период времени за счёт переключения (часто при I/O wait). **Parallelism** — задачи выполняются одновременно на разных ядрах. Asyncio в одном процессе — concurrency; multiprocessing — parallelism для CPU. См. [01-sync-vs-async](01-sync-vs-async.md).

---

## 2. Что такое event loop?

Цикл, который планирует coroutines/tasks, выполняет ready callbacks, ждёт I/O через selector. `asyncio.run()` создаёт loop, запускает main coroutine, закрывает loop. См. [04-event-loop](04-event-loop.md).

---

## 3. Coroutine vs Task vs Future?

**Coroutine** — объект `async def`, не выполняется без await/schedule. **Task** — coroutine, обёрнутая loop для concurrent execution (`create_task`). **Future** — low-level placeholder для результата (обычно внутри asyncio, редко в app code).

---

## 4. Что делает `await`?

Приостанавливает текущую coroutine, отдаёт управление loop, подписывается на завершение awaitable. После готовности — продолжение с того же stack frame. Не создаёт новый поток.

---

## 5. Когда asyncio уместен?

Когда много **I/O-bound** операций с долгим ожиданием (HTTP, DB, Redis, websockets) и нужна высокая конкурентность в **одном процессе** с async-стеком. Не для CPU-bound без offload. [26-when-not-async](26-when-not-async.md).

---

## 6. Почему `time.sleep` в async опасен?

Блокирует **весь** thread event loop — все coroutines замирают. Используйте `asyncio.sleep` для cooperative yield или `asyncio.to_thread(time.sleep, n)` для имитации blocking в тестах. [23-executors-blocking](23-executors-blocking.md).

---

## 7. `asyncio.gather` vs `TaskGroup`?

`gather` — классика, `return_exceptions` опционально. `TaskGroup` (3.11+) — structured concurrency: выход из `async with` гарантирует завершение children; при ошибке — cancel siblings + `ExceptionGroup`. [05-tasks-taskgroup](05-tasks-taskgroup.md), [09-gather-vs-taskgroup](09-gather-vs-taskgroup.md).

---

## 8. Как работает cancellation?

`task.cancel()` → при следующем `await` в целевой coroutine raises `CancelledError`. Корутина должна re-raise после cleanup. `asyncio.timeout()` отменяет scope. [07-cancellation-timeouts](07-cancellation-timeouts.md).

---

## 9. Что такое structured concurrency?

Правило: lifetime дочерних tasks **вложен** в родительский scope — нет «висящих» fire-and-forget без контроля. TaskGroup и trio — примеры. [16-structured-concurrency](16-structured-concurrency.md).

---

## 10. Зачем `asyncio.Semaphore`?

Ограничивает число одновременных операций (HTTP, DB) — **backpressure** в процессе. Без лимита — OOM и cascade failure upstream. [32-backpressure-semaphores](32-backpressure-semaphores.md).

---

## 11. Разница Lock и Semaphore?

**Lock** — один владелец. **Semaphore(N)** — до N владельцев. Lock для mutual exclusion; Semaphore для pool slots.

---

## 12. Как тестировать async код?

`pytest-asyncio`, `async` fixtures, `AsyncMock`, таймауты на тесты. Integration — env flag + Docker стенды. [27-pytest-asyncio](27-pytest-asyncio.md).

---

## 13. `asyncio.to_thread` vs `run_in_executor`?

`to_thread` — sugar над default thread pool. `run_in_executor` — произвольный executor, в т.ч. ProcessPool. [23-executors-blocking](23-executors-blocking.md).

---

## 14. Когда ProcessPool, а не thread?

CPU-bound работа (hash, image, pandas chunk) — GIL мешает threads. ProcessPool обходит GIL ценой IPC/pickle overhead.

---

## 15. Как asyncpg отличается от psycopg2?

asyncpg — native async протокол PostgreSQL, не блокирует loop. SQLAlchemy: `postgresql+asyncpg://` + `create_async_engine`. [19-asyncpg-database](19-asyncpg-database.md).

---

## 16. Как size DB pool с uvicorn workers?

`workers × (pool_size + max_overflow) ≤ max_connections`. Каждый worker — отдельный pool. [30-uvloop-production](30-uvloop-production.md).

---

## 17. redis.asyncio vs sync redis?

В `async def` sync client блокирует loop. redis-py 5.x: `import redis.asyncio as redis`, `await client.get()`, `await client.aclose()`. [21-redis-asyncio](21-redis-asyncio.md).

---

## 18. Cache-aside в async?

GET Redis → miss → await DB → SETEX Redis. Invalidate on write. Не держите DB session во время Redis await и наоборот без нужды. [22-lab-redis-async](22-lab-redis-async.md).

---

## 19. Что такое uvloop?

Быстрая реализация event loop на libuv (Linux/macOS). Ускоряет I/O scheduling, не убирает blocking Python code.

---

## 20. Сколько event loops в `--workers 4`?

**Четыре** (по одному на процесс). Корутины не мигрируют между workers. Shared state — Redis/DB, не память процесса.

---

## 21. `async def` vs `def` в FastAPI?

`async def` — coroutine на loop. `def` — Starlette выполняет в threadpool (не блокирует loop). `async def` + sync blocking — худший антипаттерн. [31-fastapi-bridge](31-fastapi-bridge.md).

---

## 22. Что такое slow callback warning?

При `debug=True` loop логирует, если callback/coroutine секция заняла > `slow_callback_duration` (default 0.1s). Сигнал blocking кода. [29-debug-profiling](29-debug-profiling.md).

---

## 23. Как graceful shutdown в asyncio?

SIGTERM → stop accept → cancel background tasks → `gather` с cleanup → close httpx/redis/engine. `asyncio.Event` или lifespan. [08-lab-graceful-shutdown](08-lab-graceful-shutdown.md).

---

## 24. Fire-and-forget task — опасность?

Task может не завершиться до process exit; исключение потеряется без callback. Лучше TaskGroup, background queue, или явный registry tasks.

---

## 25. Что такое backpressure?

Механизм замедления producer, когда consumer не успевает: Queue maxsize, Semaphore, TCP windows, 429. Без него — память и latency растут. [34-system-design-async](34-system-design-async.md).

---

## 26. Fan-out pattern?

Один request запускает N параллельных downstream calls (`gather`/TaskGroup), агрегирует результаты. Нужен semaphore + timeout per call. Gateway 8095 `/aggregate-parallel`. [18-lab-parallel-fetch](18-lab-parallel-fetch.md).

---

## 27. Circuit breaker (кратко)?

При росте ошибок upstream — «разомкнуть цепь», fail fast, периодически пробовать recovery. Библиотеки: tenacity + custom breaker; не встроен в stdlib asyncio.

---

## 28. ExceptionGroup в 3.11?

Несколько исключений из TaskGroup/gather. Ловится `except* ValueError`. Тесты: `pytest.raises(ExceptionGroup)`.

---

## 29. Как отладить «зависший» async сервис?

`asyncio.all_tasks()`, debug mode, py-spy, логи на await boundaries, проверка pool exhaustion и deadlock на Lock. [29-debug-profiling](29-debug-profiling.md).

---

## 30. Типичный capstone async microservice?

Async edge (FastAPI) → semaphore-limited httpx fan-out → parse → asyncpg write → Redis cache metrics. Тесты pytest-asyncio, deploy compose. [36-capstone](36-capstone.md).

---

## Как готовиться

1. Пройдите лабы **06, 18, 20, 22, 35**.
2. Объясните вслух **cancellation** и **pool sizing**.
3. Нарисуйте diagram: client → API → N upstream + PG + Redis.
4. Повторите [interview-cheatsheet](interview-cheatsheet.md) за 15 минут перед интервью.

Следующий урок: [34. System design async](34-system-design-async.md).
