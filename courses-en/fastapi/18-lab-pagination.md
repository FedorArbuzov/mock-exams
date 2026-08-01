# 18. Lab: A List with Filters and Pagination

## Lab goal

Extend the CRUD from [16-lab-postgres](16-lab-postgres.md) with **offset/limit**, search by `title`, an `owner_id` filter, and safe sorting. Verify the contract via Swagger and `curl` at [http://localhost:8090](http://localhost:8090).

Theory: [17-pagination-filters](17-pagination-filters.md).

---

## Before you start

```bash
cd deploy/fastapi
docker compose up -d --build
```

Seed the table with test data:

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

## Task 1. Pydantic parameter schemas

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

Wire it up via a dependency:

```python
from fastapi import Depends

def pagination(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> PaginationParams:
    return PaginationParams(offset=offset, limit=limit)
```

---

## Task 2. Repository with filters

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

## Task 3. Endpoint with meta

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

Rebuild the API and open `/docs`.

---

## Task 4. Verify the scenarios

```bash
# first page
curl -s "http://localhost:8090/api/v1/items/paged?limit=2" | jq .

# second page
curl -s "http://localhost:8090/api/v1/items/paged?offset=2&limit=2" | jq .

# search
curl -s "http://localhost:8090/api/v1/items/paged?q=alpha" | jq .

# sorting
curl -s "http://localhost:8090/api/v1/items/paged?sort=-title" | jq .

# invalid sort → 422
curl -s -o /dev/null -w "%{http_code}\n" \
  "http://localhost:8090/api/v1/items/paged?sort=owner_id"
```

**What you should see:** `meta.total` stays stable; `q=alpha` matches "Alpha bolt" and "Delta alpha kit"; an invalid `sort` returns **422**.

---

## Task 5. Cursor (bonus)

Add `GET /items/cursor` following the pattern from [17-pagination-filters](17-pagination-filters.md). Compare timing at `offset=1000` vs. cursor — on this small training dataset the difference is negligible, but on millions of rows it's critical.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| Empty `data`, total=0 | test data INSERT wasn't run |
| 422 on every request | typo in the `pattern` regex for `sort` |
| Duplicates across pages | missing `ORDER BY`, or concurrent INSERTs |
| `ilike` doesn't match Cyrillic | DB collation; stick to Latin characters for the lab |
| Slow response | run `EXPLAIN ANALYZE` in psql — you likely need an index on `owner_id` |

```bash
docker exec mock-fastapi-postgres psql -U course -d course -c \
  "EXPLAIN ANALYZE SELECT * FROM items WHERE title ILIKE '%alpha%';"
```

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | `limit` is hard-capped (max 100) |
| 2 | `q` and `owner_id` filters work together |
| 3 | `meta.total` matches `COUNT` under the same filters |
| 4 | An invalid `sort` → 422, not a SQL error |
| 5 | OpenAPI shows all query parameters |

---

## Cleanup

You can remove the test rows: `DELETE FROM items WHERE title LIKE 'Alpha%' OR title IN ('Beta nut','Gamma washer','Delta alpha kit');`

## Self-check questions

1. Why wasn't `owner_id` added to the free-form `sort`?
2. When should a client get a cursor instead of offset?
3. What index would you add for `owner_id + created_at DESC`?

Next: [19-oauth2-jwt](19-oauth2-jwt.md).
