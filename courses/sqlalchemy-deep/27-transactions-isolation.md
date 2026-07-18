# 27. Transactions, isolation, savepoints

## Введение

Order + line items must commit **together** or rollback **together**. PostgreSQL isolation levels affect anomalies.

## Что вы узнаете

- Session = transaction boundary.
- Nested savepoints.
- Isolation levels READ COMMITTED vs SERIALIZABLE.
- Optimistic concurrency.

---

## Single transaction

```python
with SessionLocal() as session:
    order = Order(status="pending")
    session.add(order)
    session.flush()
    session.add(OrderItem(order_id=order.id, product_id=1, quantity=2, unit_price="10.00"))
    session.commit()
```

Failure before commit → nothing persisted.

---

## begin_nested savepoint

```python
with SessionLocal() as session:
    session.add(Order(...))
    try:
        with session.begin_nested():
            session.add(OrderItem(...))  # may fail
    except IntegrityError:
        pass  # savepoint rolled back, outer continues
    session.commit()
```

---

## Isolation level

```python
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE"))
    with conn.begin():
        ...
```

Default PG: **READ COMMITTED**. SERIALIZABLE — serialization failures → retry.

[`postgresql-basic`](../postgresql-basic/README.md) — MVCC.

---

## Row locking

```python
product = session.scalar(
    select(Product).where(Product.id == 1).with_for_update()
)
product.stock -= 1
session.commit()
```

Prevent lost update on concurrent stock decrement.

---

## Unit of Work pattern

Session tracks all changes — one commit at end of business operation — [31-repository-uow](31-repository-uow.md).

---

## API anti-pattern

Long transaction holding row locks while calling external HTTP — keep transactions **short**.

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| Partial commit multi-step | missing single transaction |
| Lock in transaction + slow IO | deadlocks |
| Read uncommitted assumption | PG doesn't offer to clients |

## Резюме

One business operation = one transaction. savepoints for partial rollback. with_for_update for contested rows. Short transactions.

Далее: [28-lab-transaction-order](28-lab-transaction-order.md).
