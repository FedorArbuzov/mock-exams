# 11. ORM queries: select(Model), scalars, where

## Введение

`session.query()` **удалён** в 2.0 style. Всё через `select()` + `session.execute()` / `session.scalars()`.

## Что вы узнаете

- scalars vs execute.
- Filters, operators, in_, like.
- Bulk update/delete 2.0.
- count, exists patterns.

---

## scalars() for ORM entities

```python
stmt = select(Product).where(Product.is_active == True)
products = session.scalars(stmt).all()

one = session.scalar(select(Product).where(Product.sku == "BK-001"))
```

| Method | Returns |
|--------|---------|
| `scalars(stmt).all()` | list[Product] |
| `scalar(stmt)` | Product \| None |
| `execute(stmt).all()` | list[Row] — multi-column |

---

## Operators

```python
select(Product).where(
    Product.price.between(10, 50),
    Product.sku.in_(["BK-001", "BK-002"]),
    Product.title.ilike("%sql%"),
    Product.description.is_(None),
)
```

---

## AND / OR

```python
from sqlalchemy import and_, or_

select(Product).where(
    or_(Product.stock == 0, Product.is_active == False)
)
```

---

## Ordering, pagination

```python
stmt = (
    select(Product)
    .order_by(Product.price.desc(), Product.id)
    .offset(20)
    .limit(10)
)
```

---

## Bulk UPDATE 2.0

```python
from sqlalchemy import update

session.execute(
    update(Product)
    .where(Product.stock == 0)
    .values(is_active=False)
)
session.commit()
```

---

## count

```python
from sqlalchemy import func

total = session.scalar(select(func.count()).select_from(Product))
active = session.scalar(
    select(func.count()).select_from(Product).where(Product.is_active == True)
)
```

---

## Django comparison

| Django | SQLAlchemy 2.0 |
|--------|----------------|
| `Product.objects.filter()` | `select(Product).where()` |
| `select_related` | `joinedload` — [15-eager-loading](15-eager-loading.md) |
| `Q()` | `or_()`, `and_()` |

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| `.all()` on scalar | use scalars().all() |
| Case-sensitive ilike on wrong DB | use ilike for PG |
| offset without order | unstable pages |

## Резюме

2.0 ORM = `select(Model)` + `session.scalars()`. Rich where clauses. Bulk DML via update()/delete() execute.

Далее: [12-lab-orm-queries](12-lab-orm-queries.md).
