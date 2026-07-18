# 16. Лаба: fix N+1 + EXPLAIN

## Цель

Reproduce N+1, fix with joinedload, verify query count and EXPLAIN.

---

## Шаг 1. N+1 baseline

```python
from sqlalchemy import event
from shop.db import sync_engine, SyncSessionLocal

queries = []
@event.listens_for(sync_engine, "before_cursor_execute")
def log_queries(conn, cursor, statement, parameters, context, executemany):
    queries.append(statement)

queries.clear()
with SyncSessionLocal() as s:
    products = s.scalars(select(Product).limit(10)).all()
    for p in products:
        _ = p.category.slug
print("query count:", len(queries))  # expect ~11
```

---

## Шаг 2. Fix

```python
queries.clear()
with SyncSessionLocal() as s:
    stmt = select(Product).options(joinedload(Product.category)).limit(10)
    products = s.scalars(stmt).unique().all()
    for p in products:
        _ = p.category.slug
print("query count:", len(queries))  # expect 1
```

---

## Шаг 3. EXPLAIN

```bash
docker exec mock-sqlalchemy-postgres psql -U course -d shop -c "
EXPLAIN ANALYZE
SELECT p.*, c.*
FROM products p
JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
LIMIT 10;
"
```

Check index use on `is_active, category_id` — [`ix_products_active_category`](../../deploy/sqlalchemy/stack/shop/models.py).

---

## Шаг 4. selectinload for categories→products

Load all categories with products — compare query count vs joinedload on collection side.

---

## Критерии приёмки

- [ ] N+1 demonstrated (>10 queries)
- [ ] joinedload reduces to 1-2 queries
- [ ] EXPLAIN output reviewed

Далее: [17-many-to-many](17-many-to-many.md).
