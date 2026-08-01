# 15. Retries, exponential backoff, max_retries

## Intro

SMTP down, payment gateway 503 — **transient errors**. A Celery retry with backoff is better than an immediate flood.

## What you'll learn

- `self.retry()`, `countdown`, `max_retries`.
- Exponential backoff patterns.
- Retry vs circuit breaker.

---

## Basic retry

```python
@shared_task(bind=True, max_retries=5)
def charge_card(self, order_id: str):
    try:
        gateway.charge(order_id)
    except GatewayTimeout as exc:
        raise self.retry(exc=exc, countdown=30)
```

Each retry increments `self.request.retries`.

---

## Exponential backoff

```python
countdown = 2 ** self.request.retries  # 1, 2, 4, 8, 16...
raise self.retry(countdown=countdown)
```

Stack `send_welcome_email` — random failure + `2 ** retries`.

Add jitter:

```python
import random
countdown = min(300, (2 ** self.request.retries) + random.randint(0, 5))
```

---

## max_retries exceeded

After limit — task state **FAILURE**. Alert ops, manual replay, or DLQ.

```python
@shared_task(bind=True, max_retries=3, autoretry_for=(ConnectionError,))
def fetch_external(self):
    ...
```

`autoretry_for` — auto retry on exception types.

---

## Don't retry everything

| Error | Action |
|-------|--------|
| 503 timeout | retry |
| 400 invalid card | Reject, no retry |
| Duplicate key | skip (idempotent) |

---

## retry_backoff (Celery 5)

```python
@shared_task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_backoff_max=600, max_retries=5)
def flaky():
    ...
```

Built-in exponential with cap.

---

## API visibility

Return `task_id` immediately — client polls. Don't expose internal retry count unless UX needs it.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Retry non-idempotent side effect | idempotency key first |
| countdown=0 always | backoff |
| max_retries=None | set limit |

## Summary

Retry transient failures with exponential backoff + jitter. Cap max_retries. Permanent errors → Reject. Always idempotent.

Next: [16-lab-retries](16-lab-retries.md).
