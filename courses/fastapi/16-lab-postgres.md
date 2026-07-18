# 16. Лаба: PostgreSQL CRUD на стенде

## Цель лабы

Подключить **SQLAlchemy 2.0 async** к PostgreSQL из [`deploy/fastapi`](../../deploy/fastapi/README.md), реализовать CRUD для `items` с учётом схемы из `init/01-schema.sql`, подготовить основу для Alembic ([15-alembic](15-alembic.md)).

Теория: [13-sqlalchemy-async](13-sqlalchemy-async.md), [14-sessions-repos](14-sessions-repos.md), [15-alembic](15-alembic.md).

---

## Предварительно

```bash
cd deploy/fastapi
docker compose up -d --build
bash scripts/smoke.sh   # Windows: .\scripts\smoke.ps1
curl -s http://localhost:8090/health
```

| Сервис | Доступ |
|--------|--------|
| API | [http://localhost:8090](http://localhost:8090) |
| Swagger | [http://localhost:8090/docs](http://localhost:8090/docs) |
| PostgreSQL | только внутри compose: `mock-fastapi-postgres` |

```bash
docker exec mock-fastapi-postgres psql -U course -d course -c '\dt'
```

Ожидаете таблицы `users`, `items`.

---

## Задание 1. Модели и engine

В каталоге `stack/api/app/` создайте (или расширьте) модули:

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

**Что увидите:** при импорте моделей metadata совпадает с уже существующими таблицами — миграция не обязательна для старта лабы.

---

## Задание 2. Dependency и list/create

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

Подключите роутер в `main.py`: `app.include_router(items_db.router, prefix="/api/v1")`.

Пересоберите:

```bash
docker compose up -d --build
curl -s http://localhost:8090/api/v1/items
curl -s -X POST http://localhost:8090/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"title":"Lab item","description":"from curl"}'
```

**Что увидите:** JSON-массив и созданный объект с `id`.

---

## Задание 3. get / delete + транзакция

Добавьте:

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

Проверьте в Swagger: `GET /api/v1/items/1`, `DELETE`, повторный `GET` → **404**.

---

## Задание 4. Проверка в psql

```bash
docker exec mock-fastapi-postgres psql -U course -d course \
  -c "SELECT id, title FROM items ORDER BY id;"
```

Сравните с ответом API — **единый source of truth** в PostgreSQL.

---

## Задание 5 (опционально). Заготовка Alembic

```bash
docker compose exec api sh
pip install alembic psycopg2-binary
alembic init alembic
# настроить env.py: target_metadata = Base.metadata
alembic revision --autogenerate -m "baseline"
alembic stamp head   # если таблицы уже есть из init SQL
```

**Что увидите:** пустая или минимальная ревизия — схема уже создана `01-schema.sql`.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| `Connection refused` к postgres | `docker compose ps`, дождитесь `healthy` у postgres и api |
| `relation "items" does not exist` | проверьте volume: `docker compose down -v` и `up` заново |
| 500 после POST | `docker compose logs api` — часто забыли `await db.commit()` |
| Дублирование роутов `/items` | старый in-memory роутер и новый — разные prefix или отключите старый |
| ImportError `app.models` | `PYTHONPATH=/app` в Dockerfile, путь `app.main:app` |

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | `GET /api/v1/items` читает из PostgreSQL |
| 2 | `POST` создаёт строку, видимую в `psql` |
| 3 | `GET/{id}` и `DELETE/{id}` с корректными 200/201/204/404 |
| 4 | Сессия через `Depends(get_db)`, без глобального `Session` |
| 5 | Понимаете разницу init SQL и Alembic |

---

## Уборка

Данные лабы можно оставить в volume. Полный сброс: `docker compose down -v` ([README стенда](../../deploy/fastapi/README.md)).

## Вопросы для самопроверки

1. Зачем `expire_on_commit=False` в sessionmaker?
2. Где в коде граница транзакции?
3. Как избежать N+1 при списке с `owner`? См. [`postgresql-developer`](../postgresql-developer/06-n-plus-one.md).

Далее: [17-pagination-filters](17-pagination-filters.md).
