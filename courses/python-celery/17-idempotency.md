# 17. Idempotency, deduplication, transactional outbox

## Введение

At-least-once delivery + retries = **same task twice**. Без idempotency — double charge, double email.

## Что вы узнаете

- Idempotency keys.
- DB unique constraints.
- Transactional outbox pattern.

[`messaging-deep`](../messaging-deep/README.md) — outbox theory.

---

## Idempotency strategies

| Strategy | Example |
|----------|---------|
| **Natural key dedup** | `if order_id in PROCESSED: return` |
| **DB unique constraint** | `INSERT ... ON CONFLICT DO NOTHING` |
| **Redis SET NX** | `SET idempotency:ord-1 1 NX EX 86400` |
| **Stripe-style key** | client sends `Idempotency-Key` header |

Стенд:

```python
PROCESSED_IDS: set[str] = set()

if order_id in PROCESSED_IDS:
    return {"status": "already_processed"}
PROCESSED_IDS.add(order_id)
```

Production → **PostgreSQL** + unique on `order_id`.

---

## Exactly-once illusion

True exactly-once across broker + DB + external API — **impossible** without distributed transactions. Goal: **effectively-once** business outcome.

---

## Transactional outbox

```mermaid
sequenceDiagram
  participant API
  participant DB
  participant OutboxPoller
  participant Broker

  API->>DB: BEGIN; INSERT order; INSERT outbox_event; COMMIT
  OutboxPoller->>DB: SELECT unpublished events
  OutboxPoller->>Broker: publish task
  OutboxPoller->>DB: mark published
```

Order + event atomic — no lost messages if API crashes after commit.

[`postgresql-developer`](../postgresql-developer/README.md) — advisory locks.

---

## Celery task_id as dedup

```python
process_order.apply_async(args=[...], task_id=f"order-{order_id}")
```

Celery rejects duplicate task_id while first active — **not** full business dedup.

---

## Side effect ordering

1. Check idempotency
2. Perform external call
3. Mark processed **after** success

Or: mark **pending** → process → mark **done** (state machine).

---

## Типичные ошибки

| Ошибка | Consequence |
|--------|-------------|
| Mark done before work | lost retry |
| In-memory dedup set | lost on worker restart |
| No unique DB constraint | race two workers |

## Резюме

Design every task **idempotent**. Use DB constraints + outbox for reliability. Celery guarantees at-least-once, not exactly-once.

Далее: [18-lab-idempotent-order](18-lab-idempotent-order.md).
