# 04. MetaData, Table, Core INSERT/UPDATE

## Введение

Alembic, bulk scripts, legacy DB introspection — часто нужен **Core Table**, не ORM class. MetaData — registry всех tables.

## Что вы узнаете

- `MetaData`, `Table`, `Column`.
- `insert()`, `update()`, `delete()`.
- Reflection `autoload`.

---

## MetaData and Table

```python
from sqlalchemy import MetaData, Table, Column, Integer, String, Numeric

metadata = MetaData()

products = Table(
    "products",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("sku", String(64), nullable=False, unique=True),
    Column("price", Numeric(10, 2), nullable=False),
)
```

ORM `Base.metadata` — тот же объект для Alembic — [`shop/models.py`](../../deploy/sqlalchemy/stack/shop/models.py).

---

## INSERT

```python
from sqlalchemy import insert

with engine.begin() as conn:
    conn.execute(
        insert(products).values(sku="CORE-1", price="9.99")
    )
    conn.execute(
        insert(products),
        [{"sku": "CORE-2", "price": "1.00"}, {"sku": "CORE-3", "price": "2.00"}],
    )
```

Bulk insert — **executemany** — fast path.

---

## UPDATE / DELETE

```python
from sqlalchemy import update, delete

with engine.begin() as conn:
    conn.execute(
        update(products).where(products.c.sku == "CORE-1").values(price="12.00")
    )
    conn.execute(delete(products).where(products.c.sku == "CORE-3"))
```

---

## RETURNING (PostgreSQL)

```python
with engine.begin() as conn:
    row = conn.execute(
        insert(products).values(sku="RET-1", price="5.00").returning(products.c.id)
    ).one()
    print(row.id)
```

---

## Reflection

```python
metadata_reflect = MetaData()
products_reflected = Table("products", metadata_reflect, autoload_with=engine)
```

Introspect existing DB — migrations, brownfield.

---

## Core vs ORM same SQL

ORM `session.add(Product(...))` → INSERT — under the hood Core constructs same statement.

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| Table name typo | match DB exactly |
| Missing NOT NULL column | provide all required |
| No commit | use `engine.begin()` |

## Резюме

MetaData holds Table definitions. Core DML via insert/update/delete builders. Bulk insert list of dicts. RETURNING for PG.

Далее: [05-lab-core-crud](05-lab-core-crud.md).
