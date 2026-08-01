# 08. Lab: models Category Product

## Goal

Study the reference models; add a **`weight_kg`** field; autogenerate an Alembic migration.

---

## Step 1. Read models

```bash
docker exec mock-sqlalchemy-lab cat shop/models.py
```

Draw ER: Category 1—N Product, Product M—N Tag, Order 1—N OrderItem.

---

## Step 2. Add column

```python
from decimal import Decimal
from typing import Optional

weight_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 3), nullable=True)
```

On `Product` class.

---

## Step 3. Autogenerate migration

```bash
docker exec mock-sqlalchemy-lab alembic revision --autogenerate -m "add product weight_kg"
docker exec mock-sqlalchemy-lab alembic upgrade head
```

Review generated file — edit if autogen missed something.

---

## Step 4. Verify psql

```sql
\d products
-- weight_kg column present
```

---

## Step 5. Set weight via ORM

```python
with SyncSessionLocal() as s:
    p = s.scalar(select(Product).where(Product.sku == "BK-001"))
    p.weight_kg = Decimal("0.450")
    s.commit()
```

---

## Success criteria

- [ ] migration file in alembic/versions
- [ ] column in DB
- [ ] ORM read/write weight_kg

Next: [09-session-lifecycle](09-session-lifecycle.md).
