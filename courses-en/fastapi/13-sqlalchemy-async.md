# 13. SQLAlchemy 2.0 async

## Intro: "a sync ORM in an async route froze the API"

A team wrapped legacy **sync SQLAlchemy** in `async def` endpoints. Under load, latency shot up: every request blocked the event loop. Migrating to **SQLAlchemy 2.0 async** with `asyncpg` is the standard for FastAPI + Postgres ([`postgresql-basic`](../postgresql-basic/README.md)).

## What you'll learn

- **Async engine**, `async_sessionmaker`, the `asyncpg` DSN.
- The **2.0** style: `select()`, `await session.execute`.
- Declarative **ORM models** and their relationship to Pydantic.
- Initialization in **lifespan**.

## Dependencies

```text
sqlalchemy[asyncio]>=2.0
asyncpg
```

DSN:

```text
postgresql+asyncpg://course:course@postgres:5432/course
```

In the stand's compose — host `postgres`; the schema is in [`deploy/fastapi/init/01-schema.sql`](../../deploy/fastapi/init/01-schema.sql).

## Engine and session factory

```python
# app/db/session.py
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from app.core.config import settings

engine = create_async_engine(
    str(settings.DATABASE_URL),
    echo=settings.DEBUG,
    pool_pre_ping=True,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with async_session_factory() as session:
        yield session
```

`expire_on_commit=False` — convenient for reading attributes after a commit within a request (careful with detached objects).

## ORM model (2.0 style)

```python
# app/models/item.py
from datetime import datetime
from sqlalchemy import ForeignKey, String, Text, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    items: Mapped[list["Item"]] = relationship(back_populates="owner")

class Item(Base):
    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    owner: Mapped[User | None] = relationship(back_populates="items")
```

## 2.0 queries

```python
from sqlalchemy import select
from app.models.item import Item

async def list_items(session: AsyncSession) -> list[Item]:
    result = await session.execute(
        select(Item).order_by(Item.id).limit(100)
    )
    return list(result.scalars().all())

async def get_item(session: AsyncSession, item_id: int) -> Item | None:
    return await session.get(Item, item_id)
```

**Don't use** `session.query()` — that's the legacy 1.x API.

## Insert / update

```python
async def create_item(session: AsyncSession, title: str, owner_id: int) -> Item:
    item = Item(title=title, owner_id=owner_id)
    session.add(item)
    await session.flush()  # get the id without a commit
    await session.refresh(item)
    return item
```

Commit — in a yield-dependency ([07](07-dependency-injection.md), [14](14-sessions-repos.md)).

## Pydantic ↔ ORM

```python
class ItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str | None
```

```python
@router.get("/{item_id}", response_model=ItemOut)
async def get_item_endpoint(item_id: int, session: DbSession):
    item = await get_item(session, item_id)
    if not item:
        raise HTTPException(404)
    return item
```

## Lifespan

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # optional: await conn.run_sync(Base.metadata.create_all) dev only!
    yield
    await engine.dispose()
```

In prod — **Alembic**, not `create_all` ([15-alembic](15-alembic.md)).

```mermaid
flowchart LR
  REQ[HTTP Request]
  REQ --> DEP[get_session]
  DEP --> SESS[AsyncSession]
  SESS --> EX[await execute]
  EX --> PG[(PostgreSQL asyncpg)]
```

## Checking the schema on the stand

```bash
cd deploy/fastapi
docker compose up -d
docker exec mock-fastapi-postgres psql -U course -d course -c '\dt'
docker exec mock-fastapi-postgres psql -U course -d course -c 'SELECT id, title FROM items LIMIT 5;'
```

## Sync vs async SQLAlchemy

| | Sync + gunicorn | Async + uvicorn |
|---|-----------------|-----------------|
| Driver | psycopg2/psycopg | **asyncpg** |
| In `async def` | blocks the loop | `await` |
| Migration | easier with legacy | needs the 2.0 style |

Hybrid: `await session.run_sync(sync_fn)` — an escape hatch.

## Related courses

- SQL and indexes — [`postgresql-basic`](../postgresql-basic/README.md).
- N+1 — [postgresql-developer/06-n-plus-one](../postgresql-developer/06-n-plus-one.md).
- Connection pooling — [`postgresql-performance`](../postgresql-performance/README.md).

## Common mistakes

| Mistake | Symptom | Fix |
|--------|---------|---------|
| `postgresql://` without `+asyncpg` | wrong driver | async DSN |
| Forgot `await session.execute` | coroutine never awaited | always await |
| `create_all` in prod | schema drift | Alembic |
| Lazy load in async | MissingGreenlet | eager load selectinload |
| One session for the whole app | race / corruption | session per request |

## In production

- `pool_size`, `max_overflow` tuned for load.
- Read replica — a separate engine ([`postgresql-intermediate`](../postgresql-intermediate/README.md)).
- Statement and lock timeouts.

## Summary

**SQLAlchemy 2.0 async** — `create_async_engine`, `AsyncSession`, `select()` + `await execute`. ORM models with **Mapped/mapped_column**. Pydantic **from_attributes** for responses. Manage the DB schema with migrations, not `create_all` in prod.

## Checklist

- What's the DSN for uvicorn + asyncpg?
- How does `flush` differ from `commit`?
- Why is `session.query` deprecated?
- Where do you dispose of the engine?

Next lesson: [14. Sessions, repositories, transactions](14-sessions-repos.md).
