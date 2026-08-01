# 11. Serialization, content types, message limits

## Introduction

Task args are serialized to JSON and travel through the broker. **datetime**, **Decimal**, custom objects — break without an adapter.

## What you'll learn

- json vs pickle (never pickle untrusted).
- Message size limits.
- Custom serializers.

---

## Default JSON

```python
app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
)
```

**Safe:** cross-language, inspectable in RabbitMQ.  
**Limit:** only JSON types.

```python
# BAD — fails serialization
process_order.delay({"created": datetime.now()})

# GOOD
process_order.delay(datetime.now(UTC).isoformat())
```

---

## pickle — avoid in production

```python
# task_serializer="pickle"  # DON'T
```

Pickle = arbitrary code execution if the broker is compromised.

---

## Passing IDs, not objects

```python
# GOOD pattern
process_order.delay(order_id="ord-1")

@shared_task
def process_order(order_id: str):
    order = fetch_order_from_db(order_id)
```

The worker loads fresh data — no stale ORM instances.

---

## Message size

Large payloads (PDF bytes, big lists) clog the broker. Pattern:

1. Save to S3 / disk
2. Pass a URL or path in the task
3. Worker downloads it

RabbitMQ's default max message is ~128MB — but **don't**.

---

## Compression (optional)

```python
app.conf.task_compression = "gzip"
app.conf.result_compression = "gzip"
```

CPU vs network tradeoff.

---

## Content type enforcement

```python
app.conf.accept_content = ["json"]  # reject pickle messages
```

Security hardening.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Decimal not JSON serializable | str(amount) |
| UUID object | str(uuid) |
| 10MB dict in args | store externally |

## Summary

JSON only in production. Pass IDs. Keep messages small. Never pickle from untrusted sources.

Next: [12-lab-json-tasks](12-lab-json-tasks.md).
