# 06. select(), where(), join() — SQL Expression Language

## Введение

SQLAlchemy 2.0 — **единый** `select()` для Core и ORM. Composable expressions — SQL AST, не string concat.

## Что вы узнаете

- Building SELECT with where, order_by, limit.
- Joins: explicit vs relationship.
- Aggregates, group_by, having.
- Subqueries and CTEs (preview).

---

## Basic select (Core)

```python
from sqlalchemy import select

stmt = (
    select(products.c.sku, products.c.price)
    .where(products.c.price > 10)
    .order_by(products.c.price.desc())
    .limit(20)
)
rows = conn.execute(stmt).all()
```

---

## ORM select

```python
from shop.models import Product, Category

stmt = (
    select(Product)
    .where(Product.is_active == True, Product.price >= 10)
    .order_by(Product.created_at.desc())
)
products = session.scalars(stmt).all()
```

Multiple `.where()` → AND.

---

## Join

```python
stmt = (
    select(Product.sku, Category.slug)
    .join(Product.category)
    .where(Category.slug == "books")
)
for sku, slug in session.execute(stmt):
    print(sku, slug)
```

Explicit:

```python
select(Product).join(Category, Product.category_id == Category.id)
```

---

## Aggregates

```python
from sqlalchemy import func

stmt = (
    select(Category.slug, func.count(Product.id))
    .join(Product.category)
    .group_by(Category.id)
    .having(func.count(Product.id) > 5)
)
```

---

## EXISTS subquery

```python
subq = select(OrderItem.id).where(OrderItem.product_id == Product.id).exists()
stmt = select(Product).where(subq)
```

---

## CTE (PostgreSQL)

```python
active = select(Product.id).where(Product.is_active == True).cte("active_products")
stmt = select(active.c.id)
```

Reporting — [30-lab-reporting-sql](30-lab-reporting-sql.md).

---

## compile() for debug

```python
print(stmt.compile(dialect=engine.dialect, compile_kwargs={"literal_binds": True}))
```

Dev only — literal binds unsafe for prod execution.

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| Cartesian product join | missing ON clause |
| `== None` | use `.is_(None)` |
| Mutable default in filter | build stmt per request |

## Резюме

`select()` composable SQL. ORM and Core share expression language. joins, aggregates, subqueries, CTEs — all typed builders.

Далее: [07-declarative-models](07-declarative-models.md).
