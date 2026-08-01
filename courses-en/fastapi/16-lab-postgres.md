# 16. Lab: PostgreSQL CRUD on the stand

## Lab goal

Connect **SQLAlchemy 2.0 async** to the PostgreSQL from [`deploy/fastapi`](../../deploy/fastapi/README.md), implement CRUD for `items` respecting the schema from `init/01-schema.sql`, and prepare the base for Alembic ([15-alembic](15-alembic.md)).

Theory: [13-sqlalchemy-async](13-sqlalchemy-async.md), [14-sessions-repos](14-sessions-repos.md), [15-alembic](15-alembic.md).

---

## Prerequisites

```bash
cd deploy/fastapi
docker compose up -d --build
bash scripts/smoke.sh   # Windows: .\scripts\smoke.ps1
curl -s http://localhost:8090/health
```

| Service | Access |
|--------|--------|
| API | [http://localhost:8090](http://localhost:8090) |
| Swagger | [http://localhost:8090/docs](http://localhost:8090/docs) |
| PostgreSQL | inside compose only: `mock-fastapi-postgres` |

```bash
docker exec mock-fastapi-postgres psql -U course -d course -c '\dt'
```

You expect the `users`, `items` tables.

---

## Task 1. Models and engine

In the `stack/api/app/` directory, create (or extend) the modules:

`app/db/session.py`:

```python
from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

DATABASE_URL = "postgresql+asyncpg://course:course@postgres:5432/course"

engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with SessionLocal() as session:
        yield session
```

`app/models/item.py`:

```python
from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class Item(Base):
    __tablename__ = "items"
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
```

**What you'll see:** when you import the models, the metadata matches the already-existing tables — a migration isn't required to start the lab.

---

## Task 2. Dependency and list/create

`app/routers/items_db.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.item import Item

router = APIRouter(prefix="/items", tags=["items-db"])

class ItemCreate(BaseModel):
    title: str
    description: str | None = None
    owner_id: int | None = None

class ItemOut(BaseModel):
    id: int
    title: str
    description: str | None
    owner_id: int | None
    model_config = {"from_attributes": True}

@router.get("", response_model=list[ItemOut])
async def list_items(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Item).order_by(Item.id))
    return list(result.scalars().all())

@router.post("", response_model=ItemOut, status_code=status.HTTP_201_CREATED)
async def create_item(body: ItemCreate, db: AsyncSession = Depends(get_db)):
    item = Item(**body.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item
```

Wire the router into `main.py`: `app.include_router(items_db.router, prefix="/api/v1")`.

Rebuild:

```bash
docker compose up -d --build
curl -s http://localhost:8090/api/v1/items
curl -s -X POST http://localhost:8090/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"title":"Lab item","description":"from curl"}'
```

**What you'll see:** a JSON array and the created object with an `id`.

---

## Task 3. get / delete + transaction

Add:

```python
@router.get("/{item_id}", response_model=ItemOut)
async def get_item(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int, db: AsyncSession = Depends(get_db)):
    item = await db.get(Item, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    await db.delete(item)
    await db.commit()
```

Check in Swagger: `GET /api/v1/items/1`, `DELETE`, a repeated `GET` → **404**.

---

## Task 4. Verify in psql

```bash
docker exec mock-fastapi-postgres psql -U course -d course \
  -c "SELECT id, title FROM items ORDER BY id;"
```

Compare with the API response — a **single source of truth** in PostgreSQL.

---

## Task 5 (optional). Alembic scaffold

```bash
docker compose exec api sh
pip install alembic psycopg2-binary
alembic init alembic
# configure env.py: target_metadata = Base.metadata
alembic revision --autogenerate -m "baseline"
alembic stamp head   # if the tables already exist from the init SQL
```

**What you'll see:** an empty or minimal revision — the schema is already created by `01-schema.sql`.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| `Connection refused` to postgres | `docker compose ps`, wait for postgres and api to be `healthy` |
| `relation "items" does not exist` | check the volume: `docker compose down -v` and `up` again |
| 500 after POST | `docker compose logs api` — often a forgotten `await db.commit()` |
| Duplicate `/items` routes | the old in-memory router and the new one — use different prefixes or disable the old one |
| ImportError `app.models` | `PYTHONPATH=/app` in the Dockerfile, path `app.main:app` |

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | `GET /api/v1/items` reads from PostgreSQL |
| 2 | `POST` creates a row visible in `psql` |
| 3 | `GET/{id}` and `DELETE/{id}` with correct 200/201/204/404 |
| 4 | Session via `Depends(get_db)`, no global `Session` |
| 5 | You understand the difference between init SQL and Alembic |

---

## Cleanup

You can leave the lab data in the volume. Full reset: `docker compose down -v` ([stand README](../../deploy/fastapi/README.md)).

## Self-check questions

1. Why `expire_on_commit=False` in sessionmaker?
2. Where in the code is the transaction boundary?
3. How do you avoid N+1 when listing with `owner`? See [`postgresql-developer`](../postgresql-developer/06-n-plus-one.md).

Next: [17-pagination-filters](17-pagination-filters.md).
