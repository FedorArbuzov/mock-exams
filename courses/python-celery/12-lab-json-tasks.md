# 12. Лаба: JSON payloads и validation

## Цель

Добавить task с **Pydantic-validated** payload через API; проверить rejection до enqueue.

---

## Шаг 1. API model (уже есть OrderCreate)

```python
class OrderCreate(BaseModel):
    order_id: str = Field(min_length=1, max_length=64)
    amount: str = Field(default="10.00")
```

Validation в **API layer** — до `.delay()`. Worker получает clean strings.

---

## Шаг 2. Invalid request

```bash
curl -s -X POST http://localhost:8093/orders/ \
  -H "Content-Type: application/json" \
  -d '{"order_id":"","amount":"10"}'
# 422 from FastAPI — task NOT enqueued
```

---

## Шаг 3. Task with typed args

Добавьте optional task:

```python
@shared_task(name="shop.tasks.notify_slack")
def notify_slack(channel: str, message: str) -> dict:
    if len(message) > 500:
        raise ValueError("message too long")
    return {"channel": channel, "sent": True}
```

API endpoint POST `/notify/` с Pydantic `max_length=500`.

---

## Шаг 4. Serialization trap demo

```python
from decimal import Decimal
# process_order.delay("x", Decimal("10"))  # TypeError on serialize
process_order.delay("x", str(Decimal("10")))  # OK
```

---

## Шаг 5. Worker-side validation

Even with API validation — **worker must be idempotent** and validate business rules (price > 0) — defense in depth.

---

## Критерии приёмки

- [ ] Invalid API body → 422, no queue message
- [ ] Valid order enqueued and processed
- [ ] Decimal passed as str works

Далее: [13-acks-prefetch](13-acks-prefetch.md).
