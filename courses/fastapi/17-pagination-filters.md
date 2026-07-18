# 17. Пагинация, фильтры и сортировка

## Введение: «отдайте все 2 миллиона заказов»

Мобильный клиент вызвал `GET /orders` без параметров. API прочитал всю таблицу, сериализовал JSON на 400 МБ, uvicorn упёрся в память, PostgreSQL держал Seq Scan — **таймаут за nginx**. Пагинация и фильтры — не «удобство», а **защита БД и сети**. FastAPI + Pydantic делают контракт параметров явным в OpenAPI.

Связь с [`postgresql-developer`](../postgresql-developer/README.md): эффективные запросы требуют **индексов** под фильтры и сортировку.

## Что вы узнаете

- **Offset/limit** (page-based) — простота и подводные камни.
- **Cursor** (keyset) pagination для больших таблиц.
- Query-фильтры, сортировка, валидация границ.
- Ответ с метаданными для клиента.

---

## Offset / limit

```python
from fastapi import Query

@router.get("/items")
async def list_items(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Item).order_by(Item.id).offset(offset).limit(limit)
    items = (await db.execute(stmt)).scalars().all()
    total = await db.scalar(select(func.count()).select_from(Item))
    return {"items": items, "total": total, "offset": offset, "limit": limit}
```

| Параметр | Смысл |
|----------|--------|
| `offset` | сколько строк пропустить |
| `limit` | максимум в ответе (cap 100) |
| `total` | общее число (дорого на huge tables) |

**Проблема offset:** `OFFSET 100000` — PostgreSQL всё равно «проходит» 100k строк ([seq scan + sort](../postgresql-developer/README.md)). Для ленты с глубокой прокруткой — cursor.

---

## Cursor (keyset) pagination

Идея: «дай 20 записей **после** `id=1050`».

```python
from pydantic import BaseModel
from typing import Annotated

class ItemPage(BaseModel):
    items: list[ItemOut]
    next_cursor: str | None

@router.get("/items/cursor", response_model=ItemPage)
async def list_items_cursor(
    cursor: Annotated[int | None, Query(description="last seen id")] = None,
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Item).order_by(Item.id.asc())
    if cursor is not None:
        stmt = stmt.where(Item.id > cursor)
    stmt = stmt.limit(limit + 1)
    rows = list((await db.execute(stmt)).scalars().all())
    has_more = len(rows) > limit
    page = rows[:limit]
    next_cur = str(page[-1].id) if has_more and page else None
    return ItemPage(items=page, next_cursor=next_cur)
```

| Подход | Плюсы | Минусы |
|--------|-------|--------|
| Offset | произвольная страница, простой UX | деградация на больших offset |
| Cursor | стабильная latency | нет «страница 47», сложнее с произвольной сортировкой |

Курсор кодируют в Base64 JSON `{"id": 1050, "created_at": "..."}` при сортировке по составному ключу.

---

## Фильтры

```python
@router.get("/items/search")
async def search_items(
    q: str | None = Query(None, min_length=1, max_length=100),
    owner_id: int | None = None,
    created_after: datetime | None = None,
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Item)
    if q:
        stmt = stmt.where(Item.title.ilike(f"%{q}%"))
    if owner_id is not None:
        stmt = stmt.where(Item.owner_id == owner_id)
    if created_after:
        stmt = stmt.where(Item.created_at >= created_after)
    stmt = stmt.order_by(Item.created_at.desc()).limit(50)
    return (await db.execute(stmt)).scalars().all()
```

| Практика | Зачем |
|----------|-------|
| `ilike` только с `min_length` | не сканировать всё на `%` |
| Индекс `(owner_id, created_at DESC)` | фильтр + сортировка |
| Whitelist полей сортировки | `order_by=title` → SQL injection через attr |

```python
SORTABLE = {"id": Item.id, "title": Item.title, "created_at": Item.created_at}

def apply_sort(sort: str = "id"):
    desc = sort.startswith("-")
    key = sort.lstrip("-")
    col = SORTABLE.get(key)
    if not col:
        raise HTTPException(400, detail="Invalid sort field")
    return col.desc() if desc else col.asc()
```

---

## Единый контракт ответа

```python
class PageMeta(BaseModel):
    total: int | None = None
    offset: int | None = None
    limit: int
    next_cursor: str | None = None

class PagedItems(BaseModel):
    data: list[ItemOut]
    meta: PageMeta
```

Клиенты BFF и mobile получают предсказуемую структуру; `total` опционален (не считать на каждый cursor-запрос).

---

## На стенде

```bash
curl -s "http://localhost:8090/api/v1/items?offset=0&limit=5"
curl -s "http://localhost:8090/docs#/items-db/list_items"
```

После лабы [18-lab-pagination](18-lab-pagination.md) параметры появятся в реальном роутере на порту **8090**.

---

## Типичные ошибки

| Ошибка | Последствие | Решение |
|--------|-------------|---------|
| `limit=10000` без cap | OOM, slow JSON | `le=100` в Query |
| Offset без `ORDER BY` | нестабильные страницы | всегда order by PK |
| `%term%` без индекса FTS | seq scan | GIN/tsvector — см. postgresql-developer |
| Считать `total` на каждый запрос | лишняя нагрузка | cursor без total или кэш |

---

## Резюме

**Offset/limit** — для админок и малых таблиц. **Cursor** — для лент и high-volume. **Фильтры** валидируйте через Query/Pydantic; сортировку — whitelist. Индексы под реальные query patterns — в [`postgresql-developer`](../postgresql-developer/README.md).

## Чек-лист

- Почему `OFFSET 500000` медленный?
- Когда cursor ломается при вставке новых строк в начало?
- Зачем ограничивать `limit` на сервере?

Далее: [18-lab-pagination](18-lab-pagination.md).
