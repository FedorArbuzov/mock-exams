# 30. Lab: reporting query

## Goal

SQL report: top categories by revenue from order_items; run via text() and chart results.

---

## Query

```python
from sqlalchemy import text

REVENUE_BY_CATEGORY = text("""
    SELECT c.slug,
           COUNT(DISTINCT oi.order_id) AS orders,
           SUM(oi.quantity * oi.unit_price) AS revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN categories c ON c.id = p.category_id
    GROUP BY c.id
    ORDER BY revenue DESC NULLS LAST
""")
```

---

## Seed orders (if empty)

```python
with SyncSessionLocal() as s:
    order = Order(status="confirmed")
    s.add(order)
    s.flush()
    p = s.scalar(select(Product).where(Product.sku == "BK-001"))
    s.add(OrderItem(order_id=order.id, product_id=p.id, quantity=2, unit_price=p.price))
    s.commit()
```

---

## Run report

```python
with sync_engine.connect() as conn:
    rows = conn.execute(REVENUE_BY_CATEGORY).mappings().all()
    for r in rows:
        print(r["slug"], r["revenue"])
```

---

## EXPLAIN

Add `EXPLAIN ANALYZE` prefix in psql — indexes on FK columns help joins.

---

## Success criteria

- [ ] Report returns rows after seed
- [ ] Uses text() + mappings()
- [ ] Revenue math correct (qty * unit_price)

Next: [31-repository-uow](31-repository-uow.md).
