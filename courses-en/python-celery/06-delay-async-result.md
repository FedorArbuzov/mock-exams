# 06. delay, apply_async, AsyncResult

## Intro

`.delay(*args, **kwargs)` is sugar over `.apply_async()`. Production code often uses `apply_async` for queue, ETA, expires.

## What you'll learn

- `delay` vs `apply_async` vs `send_task`.
- `AsyncResult`: get, ready, successful, failed.
- Polling vs webhooks vs result backend.

---

## delay vs apply_async

```python
# equivalent
add.delay(2, 3)
add.apply_async(args=(2, 3))

# with options
add.apply_async(args=(2, 3), queue="default", countdown=30)
```

| Method | Use |
|--------|-----|
| `.delay()` | simple fire-and-forget |
| `.apply_async()` | full control |
| `app.send_task("shop.tasks.add", args=[1,2])` | call by name without import |

---

## AsyncResult

```python
from shop.celery_app import app

result = add.delay(4, 5)
result.id          # UUID
result.state       # PENDING, SUCCESS, ...
result.ready()     # True if finished
result.successful()
result.get(timeout=10)  # blocks; raises if failed
```

API polling pattern — [`shop/main.py`](../../deploy/celery/stack/shop/main.py) `GET /tasks/{task_id}/`.

---

## Blocking get in HTTP — anti-pattern

```python
# BAD in FastAPI endpoint
@app.post("/orders/sync/")
def bad(order_id: str):
    return process_order.delay(order_id, "10").get(timeout=60)
```

User waits 60s; worker tied up. **Good:** return `task_id`, client polls or websocket.

---

## Fire-and-forget (no result)

```python
app.conf.task_ignore_result = True  # global
# or per task:
@shared_task(ignore_result=True)
def log_event(event: dict):
    ...
```

Less load on Redis. A good fit for audit logs.

---

## Task ID custom

```python
add.apply_async(args=(1, 2), task_id="custom-add-001")
```

**Idempotency:** same `task_id` twice → second rejected if first still in backend. Use with care + business dedup — [17-idempotency](17-idempotency.md).

---

## Revoke

```python
app.control.revoke(task_id, terminate=True)
```

Worker kills running task (SIGTERM). Not guaranteed instant.

---

## Result expiry

```python
app.conf.result_expires = 3600  # seconds
```

Redis keys get a TTL — old results disappear.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| `.get()` in request | async poll / webhook |
| No timeout on `.get()` | always timeout= |
| Assuming exactly-once | idempotent tasks |

## Summary

`delay` = quick enqueue. `apply_async` = production options. `AsyncResult` polls the backend. Don't block HTTP on `.get()`.

Next: [07-rabbitmq-broker](07-rabbitmq-broker.md).
