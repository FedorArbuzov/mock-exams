# 18. Лаба: список с фильтрами и пагинацией

## Цель лабы

Расширить CRUD из [16-lab-postgres](16-lab-postgres.md): **offset/limit**, поиск по `title`, фильтр `owner_id`, безопасная сортировка. Проверить контракт через Swagger и `curl` на [http://localhost:8090](http://localhost:8090).

Теория: [17-pagination-filters](17-pagination-filters.md).

---

## Предварительно

```bash
cd deploy/fastapi
docker compose up -d --build
```

Наполните таблицу тестовыми данными:

```bash
docker exec mock-fastapi-postgres psql -U course -d course <<'SQL'
INSERT INTO items (title, description, owner_id) VALUES
  ('Alpha bolt', 'M8', 1),
  ('Beta nut', 'M8', 1),
  ('Gamma washer', 'M10', NULL),
  ('Delta alpha kit', 'mixed', 1);
SQL
```

---

## Задание 1. Pydantic-схемы параметров

`app/schemas/pagination.py`:

```python
from pydantic import BaseModel, Field

class PaginationParams(BaseModel):
    offset: int = Field(0, ge=0)
    limit: int = Field(20, ge=1, le=100)

class ItemFilters(BaseModel):
    q: str | None = Field(None, min_length=1, max_length=100)
    owner_id: int | None = None
    sort: str = "id"  # id, -id, title, -title
```

Подключите через dependency:

```python
from fastapi import Depends

def pagination(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> PaginationParams:
    return PaginationParams(offset=offset, limit=limit)
```

---

## Задание 2. Репозиторий с фильтрами

`app/repositories/items.py`:

```python
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.item import Item

SORTABLE = {
    "id": Item.id,
    "title": Item.title,
    "created_at": Item.created_at,
}

def _order(sort: str):
    desc = sort.startswith("-")
    key = sort.lstrip("-")
    col = SORTABLE.get(key, Item.id)
    return col.desc() if desc else col.asc()

async def list_items(
    db: AsyncSession,
    *,
    offset: int,
    limit: int,
    q: str | None,
    owner_id: int | None,
    sort: str,
):
    base = select(Item)
    if q:
        base = base.where(Item.title.ilike(f"%{q}%"))
    if owner_id is not None:
        base = base.where(Item.owner_id == owner_id)

    total = await db.scalar(select(func.count()).select_from(base.subquery()))
    stmt = base.order_by(_order(sort)).offset(offset).limit(limit)
    rows = (await db.execute(stmt)).scalars().all()
    return rows, total or 0
```

---

## Задание 3. Эндпоинт с meta

```python
class PagedResponse(BaseModel):
    data: list[ItemOut]
    meta: dict

@router.get("/paged", response_model=PagedResponse)
async def list_paged(
    pag: PaginationParams = Depends(pagination),
    q: str | None = Query(None, min_length=1),
    owner_id: int | None = None,
    sort: str = Query("id", pattern=r"^-?(id|title|created_at)$"),
    db: AsyncSession = Depends(get_db),
):
    rows, total = await list_items(
        db,
        offset=pag.offset,
        limit=pag.limit,
        q=q,
        owner_id=owner_id,
        sort=sort,
    )
    return PagedResponse(
        data=rows,
        meta={"total": total, "offset": pag.offset, "limit": pag.limit},
    )
```

Пересоберите API и откройте `/docs`.

---

## Задание 4. Проверка сценариев

```bash
# первая страница
curl -s "http://localhost:8090/api/v1/items/paged?limit=2" | jq .

# вторая страница
curl -s "http://localhost:8090/api/v1/items/paged?offset=2&limit=2" | jq .

# поиск
curl -s "http://localhost:8090/api/v1/items/paged?q=alpha" | jq .

# сортировка
curl -s "http://localhost:8090/api/v1/items/paged?sort=-title" | jq .

# невалидный sort → 422
curl -s -o /dev/null -w "%{http_code}\n" \
  "http://localhost:8090/api/v1/items/paged?sort=owner_id"
```

**Что увидите:** `meta.total` стабилен; `q=alpha` находит «Alpha bolt» и «Delta alpha kit»; неверный `sort` — **422**.

---

## Задание 5. Cursor (бонус)

Добавьте `GET /items/cursor` по образцу из [17-pagination-filters](17-pagination-filters.md). Сравните время на `offset=1000` vs cursor — на учебном объёме разница мала, на миллионах строк — критична.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| Пустой `data`, total=0 | не выполнен INSERT тестовых данных |
| 422 на все запросы | опечатка в `pattern` regex для `sort` |
| Дубликаты между страницами | нет `ORDER BY` или параллельные INSERT |
| `ilike` не находит кириллицу | collation БД; для лабы — латиница |
| Медленный ответ | `EXPLAIN ANALYZE` в psql — нужен индекс на `owner_id` |

```bash
docker exec mock-fastapi-postgres psql -U course -d course -c \
  "EXPLAIN ANALYZE SELECT * FROM items WHERE title ILIKE '%alpha%';"
```

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | `limit` жёстко ограничен (max 100) |
| 2 | Фильтры `q` и `owner_id` работают вместе |
| 3 | `meta.total` соответствует `COUNT` с теми же фильтрами |
| 4 | Недопустимый `sort` → 422, не SQL error |
| 5 | OpenAPI показывает все query-параметры |

---

## Уборка

Тестовые строки можно удалить: `DELETE FROM items WHERE title LIKE 'Alpha%' OR title IN ('Beta nut','Gamma washer','Delta alpha kit');`

## Вопросы для самопроверки

1. Почему `owner_id` не добавили в свободный `sort`?
2. Когда клиенту отдавать cursor вместо offset?
3. Какой индекс добавите для `owner_id + created_at DESC`?

Далее: [19-oauth2-jwt](19-oauth2-jwt.md).
