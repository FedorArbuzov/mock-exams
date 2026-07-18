# 12. Лаба: фильтры, order_by, pagination

## Цель

Написать query helpers: active products by category, price range, paginated list.

---

## Шаг 1. By category slug

```python
def products_by_category(session, slug: str):
    stmt = (
        select(Product)
        .join(Product.category)
        .where(Category.slug == slug, Product.is_active == True)
        .order_by(Product.title)
    )
    return session.scalars(stmt).all()
```

---

## Шаг 2. Price filter

```python
def products_in_price_range(session, min_p, max_p):
    return session.scalars(
        select(Product).where(Product.price >= min_p, Product.price <= max_p)
    ).all()
```

---

## Шаг 3. Pagination

```python
def paginate_products(session, page: int, size: int = 20):
    stmt = (
        select(Product)
        .where(Product.is_active == True)
        .order_by(Product.id)
        .offset((page - 1) * size)
        .limit(size)
    )
    items = session.scalars(stmt).all()
    total = session.scalar(select(func.count()).select_from(Product).where(Product.is_active == True))
    return items, total
```

---

## Шаг 4. Shell test

```python
from shop.db import SyncSessionLocal
with SyncSessionLocal() as s:
    print(len(products_by_category(s, "books")))
    items, total = paginate_products(s, 1)
    print(total, len(items))
```

---

## Шаг 5. EXPLAIN (optional)

```python
from sqlalchemy import text
with sync_engine.connect() as conn:
    print(conn.execute(text("EXPLAIN ANALYZE SELECT * FROM products WHERE is_active = true LIMIT 20")).all())
```

---

## Критерии приёмки

- [ ] Filter by category slug works
- [ ] Pagination returns items + total
- [ ] Stable order by id

Далее: [13-relationships-basics](13-relationships-basics.md).
