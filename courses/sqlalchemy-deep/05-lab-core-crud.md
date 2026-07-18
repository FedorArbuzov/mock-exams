# 05. Лаба: Core CRUD без ORM

## Цель

Вставить, обновить, удалить строку через **Core only** — понять SQL который ORM генерирует.

---

## Шаг 1. Define Table (scratch script)

```python
# scripts/core_crud_lab.py
from sqlalchemy import MetaData, Table, Column, Integer, String, Numeric, create_engine, insert, select, update, delete, text

engine = create_engine("postgresql+psycopg://course:course@postgres:5432/shop")
metadata = MetaData()

lab_products = Table(
    "lab_core_products", metadata,
    Column("id", Integer, primary_key=True),
    Column("sku", String(64), unique=True),
    Column("price", Numeric(10, 2)),
)

with engine.begin() as conn:
    metadata.create_all(engine, tables=[lab_products])
```

Run in lab container.

---

## Шаг 2. INSERT + SELECT

```python
with engine.begin() as conn:
    conn.execute(insert(lab_products).values(sku="LAB-1", price="10.00"))
    rows = conn.execute(select(lab_products)).mappings().all()
    print(rows)
```

---

## Шаг 3. UPDATE + DELETE

```python
with engine.begin() as conn:
    conn.execute(update(lab_products).where(lab_products.c.sku == "LAB-1").values(price="15.00"))
    conn.execute(delete(lab_products).where(lab_products.c.sku == "LAB-1"))
```

---

## Шаг 4. Compare with ORM

Same operations via `Product` model — enable `echo=True`, compare logged SQL shape.

---

## Шаг 5. Cleanup

```python
lab_products.drop(engine)
```

---

## Критерии приёмки

- [ ] Table created via metadata.create_all
- [ ] INSERT/SELECT/UPDATE/DELETE work
- [ ] Compared SQL echo with ORM equivalent

Далее: [06-core-select-expressions](06-core-select-expressions.md).
