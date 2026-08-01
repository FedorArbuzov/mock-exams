# 21. asyncpg, greenlet, run_sync

## Introduction

AsyncSession still runs ORM attribute lazy loads via **greenlet** bridge — magic with footguns.

## What you'll learn

- asyncpg driver traits.
- `await session.run_sync()`.
- Lazy load in async context.
- `asyncio.gather` for parallel queries.

---

## asyncpg

- Native asyncio PostgreSQL driver
- Fast binary protocol
- DSN: `postgresql+asyncpg://`

Limitations vs psycopg: some PG features differ — check SQLAlchemy dialect docs.

---

## Implicit IO on lazy load

```python
async with AsyncSessionLocal() as session:
    p = await session.scalar(select(Product).limit(1))
    print(p.category.name)  # may trigger sync greenlet IO — OK but hidden query
```

Prefer explicit loaders in async code — **raiseload** or joinedload.

---

## run_sync

Call sync-only API inside async session:

```python
await session.run_sync(lambda sync_session: sync_session.bulk_save_objects(objects))
```

Escape hatch — don't abuse.

---

## Parallel independent queries

```python
import asyncio

async def stats(session):
    q1 = session.scalar(select(func.count()).select_from(Product))
    q2 = session.scalar(select(func.count()).select_from(Category))
    products, categories = await asyncio.gather(q1, q2)
    return products, categories
```

**Same session** — sequential safer unless using separate connections.

---

## Multiple sessions

```python
async with AsyncSessionLocal() as s1, AsyncSessionLocal() as s2:
    ...
```

Two pool connections — true parallel.

---

## FastAPI lifespan

```python
@asynccontextmanager
async def lifespan(app):
    yield
    await async_engine.dispose()
```

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Missing greenlet | install greenlet package |
| Lazy in async list comp | eager load |
| One session concurrent awaits | race — use separate sessions |

## Summary

asyncpg for async PG. Avoid hidden lazy loads. run_sync for legacy sync hooks. gather for parallel with care.

Next: [22-lab-async-repository](22-lab-async-repository.md).
