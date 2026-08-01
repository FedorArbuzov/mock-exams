# 17. Pagination, Filters, and Sorting

## Intro: "just give me all 2 million orders"

A mobile client called `GET /orders` with no parameters. The API read the entire table, serialized a 400 MB JSON payload, uvicorn ran out of memory, and PostgreSQL sat there doing a Seq Scan — **timeout at the nginx layer**. Pagination and filters aren't a "nice to have" — they're **protection for your database and network**. FastAPI + Pydantic make the parameter contract explicit in OpenAPI.

Related to [`postgresql-developer`](../postgresql-developer/README.md): efficient queries need **indexes** matching your filters and sort order.

## What you'll learn

- **Offset/limit** (page-based) pagination — simple, with its own pitfalls.
- **Cursor** (keyset) pagination for large tables.
- Query filters, sorting, and boundary validation.
- A response shape with metadata for the client.

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

| Parameter | Meaning |
|----------|--------|
| `offset` | how many rows to skip |
| `limit` | max rows in the response (capped at 100) |
| `total` | total row count (expensive on huge tables) |

**The offset problem:** `OFFSET 100000` still makes PostgreSQL "walk through" 100k rows ([seq scan + sort](../postgresql-developer/README.md)). For deep-scroll feeds, use cursor pagination instead.

---

## Cursor (keyset) pagination

The idea: "give me 20 records **after** `id=1050`."

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

| Approach | Pros | Cons |
|--------|-------|--------|
| Offset | jump to any page, simple UX | degrades at large offsets |
| Cursor | stable latency | no "page 47", trickier with arbitrary sort orders |

When sorting by a composite key, encode the cursor as Base64 JSON, e.g. `{"id": 1050, "created_at": "..."}`.

---

## Filters

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

| Practice | Why |
|----------|-------|
| `ilike` only with `min_length` | avoid scanning everything on a bare `%` |
| Index on `(owner_id, created_at DESC)` | covers filter + sort |
| Whitelist sortable fields | `order_by=title` → SQL injection via attribute name |

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

## A unified response contract

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

BFF and mobile clients get a predictable shape; `total` is optional since you don't want to count on every cursor request.

---

## On the sandbox

```bash
curl -s "http://localhost:8090/api/v1/items?offset=0&limit=5"
curl -s "http://localhost:8090/docs#/items-db/list_items"
```

After the [18-lab-pagination](18-lab-pagination.md) lab, these parameters will show up on the real router at port **8090**.

---

## Common mistakes

| Mistake | Consequence | Fix |
|--------|-------------|---------|
| `limit=10000` with no cap | OOM, slow JSON | `le=100` in Query |
| Offset without `ORDER BY` | unstable pages | always order by PK |
| `%term%` without an FTS index | seq scan | GIN/tsvector — see postgresql-developer |
| Counting `total` on every request | extra load | cursor without total, or cache it |

---

## Summary

**Offset/limit** works for admin panels and small tables. **Cursor** is for feeds and high-volume data. Validate **filters** through Query/Pydantic; whitelist sort fields. Indexes for real query patterns are covered in [`postgresql-developer`](../postgresql-developer/README.md).

## Checklist

- Why is `OFFSET 500000` slow?
- When does a cursor break if new rows get inserted at the front?
- Why cap `limit` on the server?

Next: [18-lab-pagination](18-lab-pagination.md).
