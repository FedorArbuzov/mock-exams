# 28. Лаба: order + items atomic

## Цель

Create Order with two OrderItems atomically; rollback if stock insufficient.

---

## Step 1. Service function

```python
from decimal import Decimal
from sqlalchemy import select
from shop.models import Order, OrderItem, Product

def create_order(session, items: list[tuple[str, int]]) -> Order:
    """items: [(sku, qty), ...]"""
    order = Order(status="pending")
    session.add(order)
    session.flush()

    for sku, qty in items:
        product = session.scalar(
            select(Product).where(Product.sku == sku).with_for_update()
        )
        if not product or product.stock < qty:
            raise ValueError(f"insufficient stock for {sku}")
        product.stock -= qty
        session.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=qty,
            unit_price=product.price,
        ))
    order.status = "confirmed"
    return order
```

---

## Step 2. Success

```python
with SyncSessionLocal() as s:
    o = create_order(s, [("BK-001", 1)])
    s.commit()
    print(o.id, o.status)
```

---

## Step 3. Rollback on fail

```python
with SyncSessionLocal() as s:
    try:
        create_order(s, [("BK-001", 9999)])
        s.commit()
    except ValueError:
        s.rollback()
# stock unchanged, no order row
```

---

## Критерии приёмки

- [ ] Valid order + items committed
- [ ] Invalid qty rolls back all
- [ ] Stock decremented correctly

Далее: [29-raw-sql-hybrid](29-raw-sql-hybrid.md).
