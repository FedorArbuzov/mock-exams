# 02. Celery architecture: broker, worker, backend

## Intro

A junior sees `task.delay()` and thinks "it's Python magic." In reality it's **at least three processes**: the API publishes a message, the broker stores it, the worker consumes it.

## What you'll learn

- The message lifecycle from `delay()` to `SUCCESS`.
- The roles of broker, worker, result backend, beat.
- Prefetch, concurrency, connection pools.

---

## Message lifecycle

```mermaid
sequenceDiagram
  participant API as FastAPI
  participant Broker as RabbitMQ
  participant Worker as Celery Worker
  participant Redis as Result Backend

  API->>Broker: publish task message
  API-->>API: return task_id
  Worker->>Broker: consume message
  Worker->>Worker: execute task function
  Worker->>Redis: store result
  API->>Redis: AsyncResult.get / poll
```

1. **Producer** serializes `(task_name, args, kwargs)` → JSON → AMQP.
2. **Broker** puts it in a queue (default or named).
3. **Worker** acks after execution (or reject/requeue).
4. **Backend** stores the return value / exception state.

---

## Celery app object

```python
from celery import Celery

app = Celery("shop")
app.conf.update(
    broker_url="amqp://course:course@rabbitmq:5672//",
    result_backend="redis://redis:6379/0",
)
```

Reference: [`shop/celery_app.py`](../../deploy/celery/stack/shop/celery_app.py).

| Setting | Meaning |
|---------|---------|
| `broker_url` | where the queue lives |
| `result_backend` | where the result lives (optional) |
| `task_serializer` | json (default safe) |
| `task_acks_late` | ack after execution |
| `worker_prefetch_multiplier` | how many messages to prefetch |

---

## Worker process model

```bash
celery -A shop.celery_app worker --loglevel=info --concurrency=2
```

| Flag | Effect |
|------|--------|
| `--concurrency=2` | 2 child processes (prefork) |
| `-Q orders,default` | listen to named queues |
| `--pool=solo` | single thread (debug on Windows) |

**Prefork** is the default on Linux. I/O tasks: concurrency ≈ 2–4 × CPU. CPU-bound: `--concurrency=1` + scale replicas.

---

## Task states

| State | Meaning |
|-------|---------|
| PENDING | sent, not started |
| STARTED | worker picked up (`task_track_started=True`) |
| SUCCESS | completed |
| FAILURE | exception |
| RETRY | scheduled retry |

Poll: `AsyncResult(task_id).state`.

---

## Beat (scheduler)

A separate process — **one** beat per deployment:

```bash
celery -A shop.celery_app beat --loglevel=info
```

Beat publishes periodic tasks to the broker — workers execute them like any other task.

---

## Docker topology (stack)

```text
api:8093 ──delay()──► rabbitmq ◄── worker (×2 concurrency)
                         ▲
beat ────────────────────┘
flower (monitor)
redis ◄── results
```

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Worker without the correct `-A` app | tasks not registered |
| Multiple beat instances | duplicate periodic runs |
| No result backend | PENDING forever on `.get()` |

## Summary

Celery = **app config** + **broker** + **workers**. A message is a serialized task call. Results are optional in Redis. Beat is a separate scheduler.

Next: [03-lab-explore-stack](03-lab-explore-stack.md).
