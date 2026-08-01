# 27. Async patterns: pools, executors, and blocking traps

## Introduction: "an async endpoint with sync-level latency"

Profiling revealed the culprit: `async def report()` was calling **pandas** and **sync psycopg2** under the hood — the event loop stalled for 800 ms, and every other request had to wait. **Async** in FastAPI isn't magic: a single uvicorn thread serves thousands of coroutines as long as they **await** I/O. Blocking CPU work or a sync socket call kills that concurrency.

This connects to [`postgresql-developer`](../postgresql-developer/README.md): connection pooling and how long you hold a session affect throughput the same way they do in sync applications.

## What you'll learn

- An **asyncpg** pool via SQLAlchemy's `create_async_engine`.
- When to use **`asyncio.to_thread` / `run_in_executor`**.
- Anti-patterns: sync ORM calls, `requests`, `time.sleep` inside `async def`.
- Pool sizing and `pool_pre_ping`.

---

## The event loop in a single process

```mermaid
flowchart LR
  subgraph loop [Event loop]
    R1[Request A await DB]
    R2[Request B await Redis]
    R3[Request C BLOCKED]
  end
  R3 -->|sync CPU| Stall[Everyone waits]
```

| Safe in async | Dangerous in async |
|-------------------|----------------|
| `await session.execute()` | `session.execute()` sync |
| `await redis.get()` | `redis.Redis()` sync client |
| `await httpx.AsyncClient` | `requests.get()` |
| `await asyncio.sleep(1)` | `time.sleep(1)` |

---

## SQLAlchemy async + asyncpg pool

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

engine = create_async_engine(
    "postgresql+asyncpg://course:course@postgres:5432/course",
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,
)

SessionLocal = async_sessionmaker(engine, expire_on_commit=False)
```

| Parameter | Meaning |
|----------|--------|
| `pool_size` | persistent connections per process |
| `max_overflow` | extra connections allowed during a spike |
| `pool_pre_ping` | runs `SELECT 1` before handing out a connection — catches dead ones |
| `pool_recycle` | don't hold a connection open longer than this (firewall/NAT) |

**Rough formula:** `workers × (pool_size + max_overflow)` should stay under PostgreSQL's `max_connections`, minus some headroom.

On the compose test stand: a single uvicorn worker means `pool_size=5` is plenty for the labs.

```bash
docker exec mock-fastapi-postgres psql -U course -d course \
  -c "SHOW max_connections;"
```

---

## Keep sessions short

```python
# good: dependency yield
async def get_db():
    async with SessionLocal() as session:
        yield session

# bad: one session held for hours across a websocket's lifetime
```

Long-running transactions hold row locks in the database ([MVCC](../postgresql-basic/12-lab-mvcc.md)).

---

## run_in_executor / asyncio.to_thread

For a sync library with no async equivalent:

```python
import asyncio
from functools import partial

def resize_image(path: str) -> bytes:
    # PIL, CPU-bound
    ...

@router.post("/upload")
async def upload(file: UploadFile):
    data = await file.read()
    # don't block the loop
    result = await asyncio.to_thread(resize_image, "/tmp/img.png")
    return {"size": len(result)}
```

| Option | When |
|---------|-------|
| `asyncio.to_thread` (3.9+) | I/O-light CPU work, legacy sync functions |
| `ProcessPoolExecutor` | heavy CPU work (numpy, PDF generation) |
| Rewrite as async | httpx, asyncpg, aioredis |

```python
loop = asyncio.get_running_loop()
await loop.run_in_executor(None, partial(sync_fn, arg1, kw=2))
```

`None` as the executor means the default ThreadPool; for CPU-bound work, prefer a **ProcessPool**.

---

## Running several awaits in parallel

```python
import asyncio

async def get_dashboard(user_id: int, db: AsyncSession):
    items_coro = db.execute(select(Item).where(Item.owner_id == user_id))
    stats_coro = db.execute(select(func.count()).select_from(Item))
    items_res, stats_res = await asyncio.gather(items_coro, stats_coro)
    return items_res.scalars().all(), stats_res.scalar()
```

**Careful:** a single `AsyncSession` cannot run two `execute` calls on it concurrently — use separate sessions or sequential awaits.

---

## Sync endpoint as an escape hatch

```python
@router.get("/legacy-sync")
def legacy_sync():
    return {"ok": True}
```

FastAPI runs a sync `def` in a **threadpool** — fine for rare heavy calls, not for the hot path.

---

## httpx vs requests

```python
# async
async with httpx.AsyncClient(timeout=10.0) as client:
    r = await client.get("https://api.example.com/data")

# sync inside async def — FORBIDDEN on the hot path
# requests.get(...)  # blocks the loop
```

---

## Diagnosing on the test stand

```bash
# latency under load (install hey or ab)
hey -n 200 -c 20 http://localhost:8090/api/v1/items

docker compose logs api | tail -20
```

If p99 spikes even under light load, look for blocking calls inside `async def`.

---

## Common mistakes

| Mistake | Consequence | Fix |
|--------|-------------|---------|
| `time.sleep` in async middleware | freeze | use `asyncio.sleep` |
| Huge `pool_size` | exhausts PostgreSQL's max_connections | calculate workers × pool |
| A single global Session | races, stale data | per-request session |
| CPU work in an unbounded thread pool | GIL contention | process pool / dedicated worker |

---

## Summary

**Async FastAPI** shines when you're **awaiting I/O**. For blocking code, use **`asyncio.to_thread`** or split it out into separate sync endpoints/workers. Size your **asyncpg pool** based on worker count and PostgreSQL's limits. Caching and rate limiting come next: [28-redis-cache](28-redis-cache.md).

## Checklist

- Why is `requests` inside `async def` dangerous?
- What does `pool_pre_ping` do?
- When is ProcessPool better than ThreadPool?

Next: [28-redis-cache](28-redis-cache.md).
