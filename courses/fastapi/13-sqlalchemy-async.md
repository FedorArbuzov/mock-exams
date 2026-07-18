# 13. SQLAlchemy 2.0 async

## Введение: «sync ORM в async route заморозил API»

Команда обернула legacy **sync SQLAlchemy** в `async def` endpoints. Под нагрузкой latency выросла: каждый запрос блокировал event loop. Миграция на **SQLAlchemy 2.0 async** с `asyncpg` — стандарт для FastAPI + Postgres ([`postgresql-basic`](../postgresql-basic/README.md)).

## Что вы узнаете

- **Async engine**, `async_sessionmaker`, `asyncpg` DSN.
- Стиль **2.0**: `select()`, `await session.execute`.
- Декларативные **ORM-модели** и связь с Pydantic.
- Инициализация в **lifespan**.

## Зависимости

```text
sqlalchemy[asyncio]>=2.0
asyncpg
```

DSN:

```text
postgresql+asyncpg://course:course@postgres:5432/course
```

В compose стенда — хост `postgres`; схема в [`deploy/fastapi/init/01-schema.sql`](../../deploy/fastapi/init/01-schema.sql).

## Engine и session factory

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

`expire_on_commit=False` — удобно читать атрибуты после commit в рамках request (осторожно с detached objects).

## ORM-модель (2.0 style)

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

## Запросы 2.0

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

**Не используйте** `session.query()` — legacy 1.x API.

## Insert / update

```python
async def create_item(session: AsyncSession, title: str, owner_id: int) -> Item:
    item = Item(title=title, owner_id=owner_id)
    session.add(item)
    await session.flush()  # получить id без commit
    await session.refresh(item)
    return item
```

Commit — в yield-dependency ([07](07-dependency-injection.md), [14](14-sessions-repos.md)).

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
    # опционально: await conn.run_sync(Base.metadata.create_all) только dev!
    yield
    await engine.dispose()
```

В prod — **Alembic**, не `create_all` ([15-alembic](15-alembic.md)).

```mermaid
flowchart LR
  REQ[HTTP Request]
  REQ --> DEP[get_session]
  DEP --> SESS[AsyncSession]
  SESS --> EX[await execute]
  EX --> PG[(PostgreSQL asyncpg)]
```

## Проверка схемы на стенде

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
| В `async def` | блокирует loop | `await` |
| Миграция | проще с legacy | нужен 2.0 стиль |

Гибрид: `await session.run_sync(sync_fn)` — escape hatch.

## Связь с курсами

- SQL и индексы — [`postgresql-basic`](../postgresql-basic/README.md).
- N+1 — [postgresql-developer/06-n-plus-one](../postgresql-developer/06-n-plus-one.md).
- Connection pooling — [`postgresql-performance`](../postgresql-performance/README.md).

## Типичные ошибки

| Ошибка | Симптом | Решение |
|--------|---------|---------|
| `postgresql://` без `+asyncpg` | wrong driver | async DSN |
| Забыли `await session.execute` | coroutine never awaited | всегда await |
| `create_all` в prod | drift схемы | Alembic |
| Lazy load в async | MissingGreenlet | eager load selectinload |
| Один session на всё приложение | race / corruption | session per request |

## В продакшене

- `pool_size`, `max_overflow` под нагрузку.
- Read replica — отдельный engine ([`postgresql-intermediate`](../postgresql-intermediate/README.md)).
- Таймауты statement и lock.

## Резюме

**SQLAlchemy 2.0 async** — `create_async_engine`, `AsyncSession`, `select()` + `await execute`. ORM-модели с **Mapped/mapped_column**. Pydantic **from_attributes** для ответов. Схема БД — миграции, не `create_all` в prod.

## Чек-лист

- Какой DSN для uvicorn + asyncpg?
- Чем `flush` отличается от `commit`?
- Почему `session.query` устарел?
- Где dispose engine?

Следующий урок: [14. Сессии, репозитории, транзакции](14-sessions-repos.md).
