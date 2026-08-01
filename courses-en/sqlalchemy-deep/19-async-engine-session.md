# 19. create_async_engine, AsyncSession

## Intro

FastAPI endpoints — `async def`. A blocking sync Session **freezes the event loop**. **AsyncSession** + **asyncpg** — standard stack.

[`fastapi/13`](../fastapi/13-sqlalchemy-async.md) — API integration; here — mechanics.

## What you'll learn

- create_async_engine, async_sessionmaker.
- await session.execute / scalars.
- Context manager patterns.

---

## Setup

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

async_engine = create_async_engine(
    "postgresql+asyncpg://course:course@localhost:5433/shop",
    echo=False,
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False)
```

Stand: [`shop/db.py`](../../deploy/sqlalchemy/stack/shop/db.py).

---

## Async session usage

```python
async with AsyncSessionLocal() as session:
    result = await session.scalars(select(Product).limit(5))
    products = result.all()
    await session.commit()
```

Every IO — **`await`**.

---

## get_async_session generator

```python
async def get_async_session():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

FastAPI: `Depends(get_async_session)`.

---

## add / flush async

```python
async with AsyncSessionLocal() as session:
    session.add(Product(sku="ASYNC-1", title="Async", price="1.00", category_id=1))
    await session.flush()
    await session.commit()
```

---

## close engine

```python
await async_engine.dispose()
```

App shutdown hook.

---

## Same models sync and async

**One** DeclarativeBase models — two engines. No duplicate model classes.

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Forgot await | coroutine never runs |
| Sync session in async route | blocked loop |
| psycopg DSN on async engine | wrong driver |

## Summary

async_engine + AsyncSession + await. Same ORM models. asyncpg driver. dispose on shutdown.

Next: [20-lab-async-crud](20-lab-async-crud.md).
