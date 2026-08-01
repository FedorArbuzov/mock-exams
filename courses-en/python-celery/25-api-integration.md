# 25. FastAPI / Django integration

## Intro

Celery lives **alongside** the web app — shared code, separate processes. The API enqueues; workers import the same task modules.

## What you'll learn

- The FastAPI trigger pattern (stack).
- A Django + celery integration sketch.
- Shared package layout.

---

## FastAPI (stack)

```python
# shop/main.py
@app.post("/orders/")
def create_order(body: OrderCreate):
    result = process_order.delay(body.order_id, body.amount)
    return {"task_id": result.id, "order_id": body.order_id, "status": "queued"}
```

| Rule | Why |
|------|-----|
| Return **202 + task_id** | async UX |
| Validate before `.delay()` | bad messages never hit broker |
| Don't `.get()` in view | blocks worker thread |

[`fastapi`](../fastapi/README.md) — same API layer patterns.

---

## Django integration

```python
# myproject/celery.py
app = Celery("myproject")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()

# settings.py
CELERY_BROKER_URL = "amqp://..."
CELERY_RESULT_BACKEND = "redis://..."
INSTALLED_APPS += ["django_celery_results"]  # optional
```

```python
# orders/views.py
from .tasks import process_order

def checkout(request):
    process_order.delay(order.id)
    return JsonResponse({"status": "queued"})
```

[`django`](../django/README.md) — ORM in tasks via `get_model`.

---

## Monorepo layout

```text
src/
  shop/
    tasks.py
    models.py
  api/
    main.py      # FastAPI
  worker/
    # same shop package
```

Docker: same image, different `CMD` — api vs worker.

---

## Transaction boundary

```python
# Django view
with transaction.atomic():
    order = Order.objects.create(...)
    transaction.on_commit(lambda: process_order.delay(order.id))
```

Enqueue **after commit** — worker won't race uncommitted row.

---

## Error handling in API

```python
try:
    r = process_order.delay(...)
except kombu.exceptions.OperationalError:
    raise HTTPException(503, "queue unavailable")
```

Broker down → fail fast to client.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| delay before DB commit | on_commit |
| Circular imports | tasks in separate module |
| Django setup missing in worker | `DJANGO_SETTINGS_MODULE` |

## Summary

Web = producer only. Shared task module. Django: on_commit. FastAPI: 202 + task_id. Same Docker image, different commands.

Next: [26-lab-api-trigger](26-lab-api-trigger.md).
