# 02. Архитектура Celery: broker, worker, backend

## Введение

Junior видит `task.delay()` и думает, что «магия в Python». На самом деле — **три процесса минимум**: API публикует сообщение, broker хранит, worker потребляет.

## Что вы узнаете

- Жизненный цикл сообщения от `delay()` до `SUCCESS`.
- Роли broker, worker, result backend, beat.
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

1. **Producer** сериализует `(task_name, args, kwargs)` → JSON → AMQP.
2. **Broker** кладёт в queue (default или named).
3. **Worker** ack после выполнения (или reject/requeue).
4. **Backend** сохраняет return value / exception state.

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

Эталон: [`shop/celery_app.py`](../../deploy/celery/stack/shop/celery_app.py).

| Setting | Meaning |
|---------|---------|
| `broker_url` | где очередь |
| `result_backend` | где результат (optional) |
| `task_serializer` | json (default safe) |
| `task_acks_late` | ack после выполнения |
| `worker_prefetch_multiplier` | сколько messages prefetch |

---

## Worker process model

```bash
celery -A shop.celery_app worker --loglevel=info --concurrency=2
```

| Flag | Effect |
|------|--------|
| `--concurrency=2` | 2 child processes (prefork) |
| `-Q orders,default` | слушать named queues |
| `--pool=solo` | один thread (debug Windows) |

**Prefork** — default на Linux. I/O tasks: concurrency ≈ 2–4 × CPU. CPU-bound: `--concurrency=1` + scale replicas.

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

Отдельный процесс — **один** beat на deployment:

```bash
celery -A shop.celery_app beat --loglevel=info
```

Beat публикует periodic tasks в broker — workers их выполняют как обычные.

---

## Docker topology (стенд)

```text
api:8093 ──delay()──► rabbitmq ◄── worker (×2 concurrency)
                         ▲
beat ────────────────────┘
flower (monitor)
redis ◄── results
```

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| Worker без `-A` правильного app | tasks not registered |
| Multiple beat instances | duplicate periodic runs |
| No result backend | PENDING forever on `.get()` |

## Резюме

Celery = **app config** + **broker** + **workers**. Message = serialized task call. Results optional in Redis. Beat — отдельный scheduler.

Далее: [03-lab-explore-stack](03-lab-explore-stack.md).
