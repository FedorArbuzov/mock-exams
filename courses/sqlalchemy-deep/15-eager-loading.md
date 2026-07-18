# 15. joinedload, selectinload, subqueryload

## Введение

List 100 products, access `.category.name` each — **101 queries**. Eager loading loads related data **up front**.

## Что вы узнаете

- Loader options: joinedload, selectinload, subqueryload.
- Chains for nested relations.
- raiseload for safety.

---

## joinedload — many-to-one

```python
from sqlalchemy.orm import joinedload

stmt = (
    select(Product)
    .options(joinedload(Product.category))
    .where(Product.is_active == True)
)
products = session.scalars(stmt).unique().all()
for p in products:
    print(p.category.slug)  # no extra query
```

**`.unique()`** required — JOIN duplicates parent rows.

SQL shape: `SELECT products.*, categories.* FROM products JOIN categories ...`

---

## selectinload — one-to-many / collections

```python
from sqlalchemy.orm import selectinload

stmt = select(Category).options(selectinload(Category.products))
categories = session.scalars(stmt).all()
```

Second query: `WHERE category_id IN (...)`.

Better than joinedload for **large collections** — avoids row explosion.

---

## Nested

```python
select(Order).options(
    selectinload(Order.items).joinedload(OrderItem.product)
)
```

---

## subqueryload (legacy niche)

Extra subquery — selectinload usually preferred in 2.0.

---

## raiseload

```python
select(Product).options(raiseload(Product.category))
```

Any unexpected lazy access → error. Forces explicit loading in API layer.

---

## Django analogy

| Django | SQLAlchemy |
|--------|------------|
| select_related(FK) | joinedload |
| prefetch_related(M2M, reverse FK) | selectinload |

---

## When which

| Pattern | Loader |
|---------|--------|
| List products + category name | joinedload(Product.category) |
| List categories + all products | selectinload(Category.products) |
| Deep tree | nested selectinload |

[`postgresql-developer`](../postgresql-developer/README.md) — EXPLAIN same plan?

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| joinedload collection huge | selectinload |
| forgot .unique() | duplicate parents |
| loader on wrong query | options on stmt that executes |

## Резюме

joinedload for many-to-one. selectinload for collections. Chain for nested. Always measure query count.

Далее: [16-lab-n-plus-one](16-lab-n-plus-one.md).
