# 13. acks_late, prefetch, visibility

## Intro

A worker received a message and **died** mid-task. Without correct acks, the message is lost or duplicated.

## What you'll learn

- Early ack vs `acks_late=True`.
- `worker_prefetch_multiplier`.
- Reject, requeue, dead letter.

---

## Ack timing

| Mode | Behavior |
|------|----------|
| **Early ack** (default early) | ack before task runs — crash = **lost** |
| **acks_late=True** | ack after success — crash = **redelivered** |

```python
app.conf.task_acks_late = True
```

Enabled on the stack — [`celery_app.py`](../../deploy/celery/stack/shop/celery_app.py).

**Tradeoff:** at-least-once delivery → **idempotent tasks** required.

---

## Prefetch

```python
app.conf.worker_prefetch_multiplier = 1
```

Worker prefetches N messages per concurrency slot. High prefetch + long tasks = **unfair queue** (one worker hoards).

Rule of thumb for long tasks: **prefetch=1**.

---

## Reject

```python
from celery.exceptions import Reject

raise Reject("permanent failure", requeue=False)
```

Message discarded or sent to DLX (if configured). Stack `amount=fail` — [18-lab-idempotent-order](18-lab-idempotent-order.md).

---

## Visibility timeout (Redis broker)

Redis broker uses visibility timeout — message reappears if not acked in time. RabbitMQ — consumer cancel + requeue.

---

## task_reject_on_worker_lost

```python
app.conf.task_reject_on_worker_lost = True
```

If worker process killed — message requeued (with acks_late).

---

## DLX pattern

Failed messages → dead letter queue → alert ops. Configure in RabbitMQ queue args — [`rabbitmq-intermediate`](../rabbitmq-intermediate/README.md).

---

## Common mistakes

| Mistake | Effect |
|--------|--------|
| acks_late + non-idempotent | duplicate side effects |
| prefetch=4 + 10min tasks | queue starvation |
| Infinite requeue on bad message | poison pill loop — use Reject |

## Summary

Production: `acks_late=True`, low prefetch, idempotent handlers. Reject permanent failures. Monitor the DLQ.

Next: [14-lab-acks](14-lab-acks.md).
