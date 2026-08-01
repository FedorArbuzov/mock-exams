# 04. Celery app: configuration, shared_task, bind

## Intro

One project — one **Celery app** (like a single Django project). All tasks are registered on it; workers import the same app.

## What you'll learn

- The structure of `celery_app.py` + `tasks.py`.
- `@app.task` vs `@shared_task`.
- `bind=True`, `max_retries`, task options.

---

## Project layout

```text
shop/
  celery_app.py   # Celery("shop") + conf
  tasks.py        # @shared_task functions
  main.py         # FastAPI producer
  config.py       # env settings
```

---

## Celery app

```python
from celery import Celery
from shop.config import settings

app = Celery("shop")
app.conf.update(
    broker_url=settings.celery_broker_url,
    result_backend=settings.celery_result_backend,
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

import shop.tasks  # register tasks
```

---

## Defining tasks

```python
from celery import shared_task

@shared_task(name="shop.tasks.ping")
def ping() -> dict:
    return {"pong": True}
```

| Decorator | When |
|-----------|------|
| `@app.task` | explicit app import |
| `@shared_task` | works before app fully loaded (Django style) |

An explicit `name=` gives a stable identifier when you refactor the module path.

---

## bind=True for retries

```python
@shared_task(bind=True, max_retries=3)
def send_email(self, user_id: str):
    try:
        ...
    except SMTPException as exc:
        raise self.retry(exc=exc, countdown=60)
```

`self.request` — id, retries, delivery_info.

---

## Task options (decorator / apply_async)

```python
process_order.apply_async(
    args=["ord-1", "10.00"],
    queue="orders",
    countdown=10,
    expires=3600,
    retry=True,
)
```

| Option | Effect |
|--------|--------|
| `queue` | target queue |
| `countdown` | delay seconds |
| `eta` | execute at datetime |
| `expires` | drop if not started in time |

---

## Configuration sources

1. `app.conf.update(...)` in code
2. Module `celeryconfig.py` — `app.config_from_object("celeryconfig")`
3. Environment variables — `CELERY_BROKER_URL` (via your Settings wrapper)

The stack uses **pydantic-settings** — [`shop/config.py`](../../deploy/celery/stack/shop/config.py).

---

## Routing preview

```python
task_routes={
    "shop.tasks.process_order": {"queue": "orders"},
    "shop.tasks.generate_report": {"queue": "reports"},
},
```

Worker must listen: `-Q default,orders,reports`. Details: [23-routes-queues](23-routes-queues.md).

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Task not registered | import tasks in celery_app |
| Circular import | lazy import inside task body |
| Wrong task name | use explicit `name=` |

## Summary

One Celery app per project. `@shared_task` + explicit names. `bind=True` for the retry API. Config centralizes broker/backend behavior.

Next: [05-lab-first-task](05-lab-first-task.md).
