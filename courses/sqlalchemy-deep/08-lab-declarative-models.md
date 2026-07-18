# 08. Лаба: models Category Product

## Цель

Изучить эталонные models; добавить поле **`weight_kg`**; autogenerate Alembic migration.

---

## Шаг 1. Read models

```bash
docker exec mock-sqlalchemy-lab cat shop/models.py
```

Draw ER: Category 1—N Product, Product M—N Tag, Order 1—N OrderItem.

---

## Шаг 2. Add column

```python
from decimal import Decimal
from typing import Optional

weight_kg: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 3), nullable=True)
```

On `Product` class.

---

## Шаг 3. Autogenerate migration

```bash
docker exec mock-sqlalchemy-lab alembic revision --autogenerate -m "add product weight_kg"
docker exec mock-sqlalchemy-lab alembic upgrade head
```

Review generated file — edit if autogen missed something.

---

## Шаг 4. Verify psql

```sql
\d products
-- weight_kg column present
```

---

## Шаг 5. Set weight via ORM

```python
with SyncSessionLocal() as s:
    p = s.scalar(select(Product).where(Product.sku == "BK-001"))
    p.weight_kg = Decimal("0.450")
    s.commit()
```

---

## Критерии приёмки

- [ ] migration file in alembic/versions
- [ ] column in DB
- [ ] ORM read/write weight_kg

Далее: [09-session-lifecycle](09-session-lifecycle.md).
