# 19. asyncpg and SQLAlchemy async sessions

## Intro: "the API responds in 200 ms, but Postgres holds 40 connections"

After [18-lab-parallel-fetch](18-lab-parallel-fetch.md) you can pull HTTP in parallel. The next step is **persistence**: every `await session.execute()` must **not block** the event loop and **not exhaust** PostgreSQL's `max_connections`. The team stood up FastAPI with `async def`, but forgot about the **asyncpg pool** — under a load of 200 RPS the database responds `FATAL: too many connections`.

This chapter is the theory of **asyncpg** and **SQLAlchemy 2.x async**. Practice — [20-lab-async-database](20-lab-async-database.md). The applied FastAPI context — [27-async-patterns](../fastapi/27-async-patterns.md); the stand — [`deploy/postgres`](../../deploy/postgres/README.md).

## What you'll learn

- How **asyncpg** works on top of asyncio (the PostgreSQL protocol without blocking).
- **`create_async_engine`**, **`async_sessionmaker`**, the session lifecycle.
- Pool parameters: `pool_size`, `max_overflow`, `pool_pre_ping`, `pool_recycle`.
- Anti-patterns: sync psycopg2 in `async def`, a long transaction with an open session.

---

## asyncpg vs a sync driver

| | psycopg2 (sync) | asyncpg |
|---|-----------------|---------|
| Model | blocking socket | non-blocking + await |
| In asyncio | blocks the loop | proper await |
| Performance | baseline | less overhead on row fetch |
| SQLAlchemy | `create_engine` | `create_async_engine` + `asyncpg` |

```mermaid
flowchart LR
  Coro[Handler coroutine]
  Pool[SQLAlchemy pool]
  APG[asyncpg connection]
  PG[(PostgreSQL)]
  Coro -->|await session.execute| Pool
  Pool -->|await| APG
  APG --> PG
```

**Rule:** one **uvicorn worker** = one event loop = one pool per process. Several workers — several pools ([30-uvloop-production](30-uvloop-production.md)).

---

## The connection string and engine

The mock-exams stand:

```bash
cd deploy/postgres
docker compose up -d
# postgresql://course:course@localhost:5432/course
```

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

DATABASE_URL = "postgresql+asyncpg://course:course@localhost:5432/course"

engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,  # True for SQL debugging
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
```

| Parameter | Meaning |
|----------|--------|
| `pool_size` | persistent connections in the pool |
| `max_overflow` | temporary connections above `pool_size` at a peak |
| `pool_pre_ping` | `SELECT 1` before handing out — discards dead conns |
| `pool_recycle` | recreate conns older than N seconds (NAT, idle timeout) |
| `expire_on_commit=False` | objects stay usable after commit (handy in an API) |

**Formula (roughly):** `workers × (pool_size + max_overflow)` ≤ `max_connections` − a reserve for migrations and admins.

```bash
docker exec mock-postgres psql -U course -d course -c "SHOW max_connections;"
```

---

## The session pattern: a short scope

```python
from sqlalchemy import text

async def fetch_user_count() -> int:
    async with SessionLocal() as session:
        result = await session.execute(text("SELECT COUNT(*) FROM users"))
        return result.scalar_one()

async def create_user(email: str) -> None:
    async with SessionLocal() as session:
        async with session.begin():
            await session.execute(
                text("INSERT INTO users (email) VALUES (:email)"),
                {"email": email},
            )
        # commit happens automatically on exit from begin()
```

| Pattern | When |
|---------|-------|
| `async with SessionLocal()` | one operation / request-scoped unit |
| `async with session.begin()` | an explicit transaction |
| `yield session` in a dependency | FastAPI lifespan ([31-fastapi-bridge](31-fastapi-bridge.md)) |

**Anti-pattern:** keeping a session open during `await httpx.get(...)` — the connection is held, the pool is exhausted.

---

## Async ORM (briefly)

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import select

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str]

async def get_user(session: AsyncSession, user_id: int) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
```

`await session.commit()`, `await session.refresh(obj)` — all via await. A sync `session.commit()` in a coroutine = blocking the loop.

---

## Direct asyncpg (without ORM)

For microservices or batch ETL, sometimes plain **asyncpg** is enough:

```python
import asyncpg

async def direct_query() -> list[asyncpg.Record]:
    conn = await asyncpg.connect(
        "postgresql://course:course@localhost:5432/course"
    )
    try:
        rows = await conn.fetch("SELECT id, email FROM users LIMIT 10")
        return rows
    finally:
        await conn.close()

# asyncpg pool
async def with_pool():
    pool = await asyncpg.create_pool(
        "postgresql://course:course@localhost:5432/course",
        min_size=2,
        max_size=10,
    )
    async with pool.acquire() as conn:
        return await conn.fetchval("SELECT 1")
    await pool.close()
```

The SQLAlchemy async engine uses asyncpg internally — don't mix two pools in one process without a reason.

---

## Common mistakes

| Mistake | Why it's bad | The right way |
|--------|--------------|---------------|
| `create_engine` (sync) in async FastAPI | blocks the loop on every query | `create_async_engine` |
| N+1 without `selectinload` | an avalanche of awaits to the DB | eager load or raw SQL |
| `pool_size=50` on 1 worker | 50 conns for little RPS | start with 5–10, measure |
| Forgot `await engine.dispose()` | leaked connections on shutdown | lifespan / `atexit` |
| Long CPU inside `async with session` | conn isn't returned to the pool | commit → release → CPU |

---

## On the stand

```bash
cd deploy/postgres && docker compose up -d
docker exec mock-postgres psql -U course -d course -c "\dt"
```

The tables appear after the [20-lab-async-database](20-lab-async-database.md) lab. For a smoke check:

```bash
docker exec mock-postgres psql -U course -d course -c "SELECT 1 AS ok;"
```

---

## In production

- **Metrics:** pool checkout time, `pg_stat_activity`, idle in transaction.
- **Migrations:** an Alembic sync engine separate from the runtime async pool.
- **Read replica:** a second engine with a read-only URL; don't share a session between write/read without routing.
- **Relation to Redis:** cache-aside after a read — [21-redis-asyncio](21-redis-asyncio.md).

---

## Summary

**asyncpg** provides non-blocking access to PostgreSQL; **SQLAlchemy async** adds the ORM and pool. Keep sessions **short**, count **connections × workers**, use **`pool_pre_ping`**. Async HTTP without an async DB is half an architecture.

## Checklist

- How does `create_async_engine` differ from `create_engine`?
- Why `pool_pre_ping` on a stand with a Docker restart?
- Why can't you hold a session during an external HTTP call?
- How are uvicorn workers and the pool size related?

Next lesson: [20. Lab: async database](20-lab-async-database.md).
