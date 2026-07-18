# Asyncio — interview cheatsheet

Краткая шпаргалка перед собеседованием. Развёрнутые ответы — [33-interview-qa](33-interview-qa.md).

---

## Одна фраза

**Asyncio** = один поток + event loop + cooperative `await` для **конкурентного I/O**, не для CPU.

---

## Таблица выбора инструмента

| Нагрузка | Инструмент |
|----------|------------|
| Много HTTP/DB/Redis wait | asyncio + async libs |
| Legacy sync SDK | threads / `to_thread` |
| CPU hash/image/ML | ProcessPool / Celery |
| 3 URL в CLI раз в час | sync httpx |

---

## Ключевые API (Python 3.11+)

```python
asyncio.run(main())
asyncio.create_task(coro)
async with asyncio.TaskGroup() as tg: ...
await asyncio.gather(a, b)
async with asyncio.timeout(5.0): ...
await asyncio.sleep(0.1)
await asyncio.to_thread(sync_fn, arg)
async with asyncio.Semaphore(10): ...
asyncio.Event() / Lock() / Queue()
```

---

## Антипаттерны (красные флаги)

| Нельзя в `async def` | Вместо |
|----------------------|--------|
| `time.sleep` | `asyncio.sleep` |
| `requests.get` | `httpx.AsyncClient` |
| sync psycopg2 | asyncpg |
| sync `redis.Redis` | `redis.asyncio` |
| тяжёлый pandas | ProcessPool / worker |

---

## gather vs TaskGroup

| | gather | TaskGroup |
|---|--------|-----------|
| Ошибка | опция `return_exceptions` | ExceptionGroup, cancel siblings |
| Стиль | гибкий | structured |
| Python | 3.7+ | 3.11+ |

---

## Cancellation

1. `task.cancel()`
2. На следующем `await` → `CancelledError`
3. Cleanup в `try/finally`, **re-raise** CancelledError
4. `gather(..., return_exceptions=True)` после mass cancel

---

## Production sizing

```
uvicorn workers ≈ (2 × CPU) + 1   # старт
PG connections ≤ workers × (pool_size + max_overflow)
```

- **uvloop** — Linux/macOS, не Windows
- **Semaphore** — in-process backpressure
- **Redis** — rate limit между workers

---

## FastAPI за 30 секунд

- `async def` → coroutine на loop
- `def` → threadpool (OK для blocking)
- **lifespan** → httpx, redis, engine
- **Depends yield** → короткая DB session

См. [31-fastapi-bridge](31-fastapi-bridge.md), [27-async-patterns](../fastapi/27-async-patterns.md).

---

## Тесты

```ini
[pytest]
asyncio_mode = auto
```

- `AsyncMock`, `assert_awaited_once`
- async fixtures с `yield`
- `@pytest.mark.asyncio`

---

## Debug

```bash
PYTHONASYNCIODEBUG=1 python app.py
asyncio.run(main(), debug=True)
py-spy top --pid <pid>
```

Slow callback > 100 ms → ищите blocking код.

---

## System design buzzwords

| Термин | Суть |
|--------|------|
| Fan-out | N parallel downstream |
| Backpressure | Semaphore, Queue maxsize |
| Circuit breaker | fail fast при ошибках upstream |
| Cache-aside | Redis GET → miss → DB → SETEX |
| Partial failure | вернуть 200 + degraded body |

---

## Стенды mock-exams

| Порт | Стенд |
|------|-------|
| 8095 | deploy/python-async gateway |
| 5432 | deploy/postgres |
| 6379 | deploy/redis |
| 8090 | deploy/fastapi |

---

## Топ-10 вопросов «must know»

1. Concurrency vs parallelism?
2. Что делает `await`?
3. Почему blocking в async плох?
4. gather vs TaskGroup?
5. Как cancel корутину?
6. Semaphore зачем?
7. to_thread vs ProcessPool?
8. Сколько loops у 4 uvicorn workers?
9. asyncpg vs psycopg2?
10. Как тестировать async?

---

## Лабы для демо на интервью

- [06-lab-concurrent-io](06-lab-concurrent-io.md) — gather dashboard
- [18-lab-parallel-fetch](18-lab-parallel-fetch.md) — fan-out 8095
- [35-lab-rate-limited-fetcher](35-lab-rate-limited-fetcher.md) — semaphore + retry
- [36-capstone](36-capstone.md) — полный pipeline

---

## Перед интервью (15 min)

1. Проговорите **cancellation** и **pool sizing** вслух.
2. Нарисуйте **fan-out** с 3 upstream + PG + Redis.
3. Назовите **2 случая без asyncio**.
4. Откройте [33-interview-qa](33-interview-qa.md) — пробегите 30 ответов.
