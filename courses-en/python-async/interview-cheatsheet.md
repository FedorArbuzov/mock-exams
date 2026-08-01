# Asyncio — interview cheatsheet

Short cheatsheet before an interview. Expanded answers — [33-interview-qa](33-interview-qa.md).

---

## One sentence

**Asyncio** = one thread + event loop + cooperative `await` for **concurrent I/O**, not for CPU.

---

## Tool choice table

| Load | Tool |
|------|------|
| Lots of HTTP/DB/Redis wait | asyncio + async libs |
| Legacy sync SDK | threads / `to_thread` |
| CPU hash/image/ML | ProcessPool / Celery |
| 3 URLs in a CLI once an hour | sync httpx |

---

## Key APIs (Python 3.11+)

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

## Antipatterns (red flags)

| Never in `async def` | Instead |
|----------------------|---------|
| `time.sleep` | `asyncio.sleep` |
| `requests.get` | `httpx.AsyncClient` |
| sync psycopg2 | asyncpg |
| sync `redis.Redis` | `redis.asyncio` |
| heavy pandas | ProcessPool / worker |

---

## gather vs TaskGroup

| | gather | TaskGroup |
|---|--------|-----------|
| On error | optional `return_exceptions` | ExceptionGroup, cancel siblings |
| Style | flexible | structured |
| Python | 3.7+ | 3.11+ |

---

## Cancellation

1. `task.cancel()`
2. On the next `await` → `CancelledError`
3. Cleanup in `try/finally`, **re-raise** CancelledError
4. `gather(..., return_exceptions=True)` after mass cancel

---

## Production sizing

```
uvicorn workers ≈ (2 × CPU) + 1   # start
PG connections ≤ workers × (pool_size + max_overflow)
```

- **uvloop** — Linux/macOS, not Windows
- **Semaphore** — in-process backpressure
- **Redis** — rate limit across workers

---

## FastAPI in 30 seconds

- `async def` → coroutine on the loop
- `def` → threadpool (OK for blocking)
- **lifespan** → httpx, redis, engine
- **Depends yield** → short DB session

See [31-fastapi-bridge](31-fastapi-bridge.md), [27-async-patterns](../fastapi/27-async-patterns.md).

---

## Tests

```ini
[pytest]
asyncio_mode = auto
```

- `AsyncMock`, `assert_awaited_once`
- async fixtures with `yield`
- `@pytest.mark.asyncio`

---

## Debug

```bash
PYTHONASYNCIODEBUG=1 python app.py
asyncio.run(main(), debug=True)
py-spy top --pid <pid>
```

Slow callback > 100 ms → look for blocking code.

---

## System design buzzwords

| Term | Essence |
|------|---------|
| Fan-out | N parallel downstream |
| Backpressure | Semaphore, Queue maxsize |
| Circuit breaker | fail fast on upstream errors |
| Cache-aside | Redis GET → miss → DB → SETEX |
| Partial failure | return 200 + degraded body |

---

## mock-exams stands

| Port | Stand |
|------|-------|
| 8095 | deploy/python-async gateway |
| 5432 | deploy/postgres |
| 6379 | deploy/redis |
| 8090 | deploy/fastapi |

---

## Top-10 “must know” questions

1. Concurrency vs parallelism?
2. What does `await` do?
3. Why is blocking in async bad?
4. gather vs TaskGroup?
5. How do you cancel a coroutine?
6. Why Semaphore?
7. to_thread vs ProcessPool?
8. How many loops with 4 uvicorn workers?
9. asyncpg vs psycopg2?
10. How do you test async?

---

## Labs for interview demos

- [06-lab-concurrent-io](06-lab-concurrent-io.md) — gather dashboard
- [18-lab-parallel-fetch](18-lab-parallel-fetch.md) — fan-out 8095
- [35-lab-rate-limited-fetcher](35-lab-rate-limited-fetcher.md) — semaphore + retry
- [36-capstone](36-capstone.md) — full pipeline

---

## Before the interview (15 min)

1. Say **cancellation** and **pool sizing** out loud.
2. Draw **fan-out** with 3 upstream + PG + Redis.
3. Name **2 cases without asyncio**.
4. Open [33-interview-qa](33-interview-qa.md) — skim all 30 answers.
