# 10. Lab: sync Session CRUD

## Goal

Full CRUD cycle for Category + Product through a sync Session.

---

## Step 1. Create

```python
from decimal import Decimal
from sqlalchemy import select
from shop.db import SyncSessionLocal
from shop.models import Category, Product

with SyncSessionLocal() as session:
    electronics = Category(name="Electronics", slug="electronics")
    session.add(electronics)
    session.flush()
    session.add(Product(
        sku="EL-001", title="USB Cable", price=Decimal("12.99"),
        stock=100, category=electronics,
    ))
    session.commit()
```

---

## Step 2. Read

```python
with SyncSessionLocal() as session:
    p = session.scalar(select(Product).where(Product.sku == "EL-001"))
    print(p.title, p.category.slug)  # lazy load category
```

---

## Step 3. Update

```python
with SyncSessionLocal() as session:
    p = session.scalar(select(Product).where(Product.sku == "EL-001"))
    p.price = Decimal("9.99")
    p.stock -= 1
    session.commit()
```

---

## Step 4. Delete

```python
with SyncSessionLocal() as session:
    p = session.scalar(select(Product).where(Product.sku == "EL-001"))
    session.delete(p)
    session.commit()
```

---

## Step 5. Rollback lab

```python
with SyncSessionLocal() as session:
    session.add(Category(name="Temp", slug="temp"))
    session.flush()
    session.rollback()
# slug temp not in DB
```

---

## Success criteria

- [ ] Create visible in psql
- [ ] Update changes price
- [ ] Delete removes row
- [ ] Rollback discards uncommitted

Next: [11-orm-select-20-style](11-orm-select-20-style.md).
