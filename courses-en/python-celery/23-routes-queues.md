# 23. Routes, queues, priorities

## Intro

Heavy reports shouldn't block **order processing**. Separate queues + dedicated workers = isolation.

## What you'll learn

- `task_routes`, named queues.
- Worker `-Q` binding.
- Priorities (RabbitMQ).

---

## task_routes

```python
app.conf.task_routes = {
    "shop.tasks.process_order": {"queue": "orders"},
    "shop.tasks.generate_report": {"queue": "reports"},
}
```

Default unrouted → `default` queue.

---

## apply_async override

```python
generate_report.apply_async(args=["daily"], queue="reports")
```

Overrides route for one call.

---

## Worker queues

```bash
# one worker all queues
celery worker -Q default,orders,reports

# dedicated workers
celery worker -Q orders --concurrency=4
celery worker -Q reports --concurrency=1
```

Compose stack: single worker `-Q default,orders,reports`. Production: **split deployments**.

---

## Define queues explicitly (optional)

```python
from kombu import Queue

app.conf.task_queues = (
    Queue("default"),
    Queue("orders"),
    Queue("reports"),
)
```

---

## Priority (RabbitMQ)

```python
process_order.apply_async(args=[...], priority=9)  # 0-9, higher first
```

Requires:

```python
app.conf.task_queue_max_priority = 10
```

Redis broker — limited priority support.

---

## Rate limits

```python
@shared_task(rate_limit="10/m")
def call_external_api():
    ...
```

Per-worker throttle — not global across cluster without token bucket in Redis.

---

## Monitoring queue depth

Alert if `orders` queue > 1000 messages — scale workers.

```bash
rabbitmqctl list_queues name messages
```

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Task routed to `orders`, worker only `-Q default` | infinite PENDING |
| One worker for all queues | reports block orders |
| priority without max_priority | ignored |

## Summary

Routes isolate traffic. Match worker `-Q` to routes. Split workers for SLA tiers. Monitor depth.

Next: [24-lab-multi-queue](24-lab-multi-queue.md).
