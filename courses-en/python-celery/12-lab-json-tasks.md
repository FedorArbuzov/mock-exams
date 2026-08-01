# 12. Lab: JSON payloads and validation

## Goal

Add a task with a **Pydantic-validated** payload via the API; verify rejection before enqueue.

---

## Step 1. API model (OrderCreate already exists)

```python
class OrderCreate(BaseModel):
    order_id: str = Field(min_length=1, max_length=64)
    amount: str = Field(default="10.00")
```

Validation in the **API layer** — before `.delay()`. The worker receives clean strings.

---

## Step 2. Invalid request

```bash
curl -s -X POST http://localhost:8093/orders/ \
  -H "Content-Type: application/json" \
  -d '{"order_id":"","amount":"10"}'
# 422 from FastAPI — task NOT enqueued
```

---

## Step 3. Task with typed args

Add an optional task:

```python
@shared_task(name="shop.tasks.notify_slack")
def notify_slack(channel: str, message: str) -> dict:
    if len(message) > 500:
        raise ValueError("message too long")
    return {"channel": channel, "sent": True}
```

API endpoint POST `/notify/` with Pydantic `max_length=500`.

---

## Step 4. Serialization trap demo

```python
from decimal import Decimal
# process_order.delay("x", Decimal("10"))  # TypeError on serialize
process_order.delay("x", str(Decimal("10")))  # OK
```

---

## Step 5. Worker-side validation

Even with API validation — **worker must be idempotent** and validate business rules (price > 0) — defense in depth.

---

## Success criteria

- [ ] Invalid API body → 422, no queue message
- [ ] Valid order enqueued and processed
- [ ] Decimal passed as str works

Next: [13-acks-prefetch](13-acks-prefetch.md).
