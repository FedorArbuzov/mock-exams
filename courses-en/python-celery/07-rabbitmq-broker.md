# 07. RabbitMQ as a broker: AMQP, exchanges, queues

## Intro

Celery with **RabbitMQ** is the classic combo: durable queues, routing, HA (quorum queues). Redis as a broker is simpler but has different trade-offs — [09-redis-backend](09-redis-backend.md).

## What you'll learn

- How Celery maps tasks to AMQP queues.
- Default exchange, routing keys, vhost.
- Durable messages, persistence.

---

## Celery + RabbitMQ mapping

Celery creates queues automatically:

| Queue | Typical tasks |
|-------|---------------|
| `default` | un routed tasks |
| `orders` | `task_routes` → process_order |
| `reports` | generate_report |

Worker `-Q default,orders,reports` binds consumers.

```python
broker_url = "amqp://user:pass@host:5672//"
# trailing // = default vhost /
```

---

## AMQP flow (simplified)

```text
Producer (API) → exchange → binding → queue → consumer (worker)
```

Celery abstracts exchanges — but the Management UI shows **queues** and **message rates**.

[`rabbitmq-basic/04-exchanges`](../rabbitmq-basic/04-exchanges.md) — fundamentals.

---

## Why RabbitMQ for Celery

| Pro | Con |
|-----|-----|
| Mature AMQP | ops overhead |
| Quorum queues HA | need cluster for true HA |
| DLX for dead letters | config complexity |
| Back-pressure | slower than Redis broker |

---

## Connection pooling

Each worker process opens broker connections. `broker_pool_limit` — limit connections from one machine.

```python
app.conf.broker_connection_retry_on_startup = True
```

Docker: wait for `rabbitmq` to be healthy before the worker starts — see the compose `depends_on`.

---

## Quorum queues (preview)

RabbitMQ 3.8+ quorum queues — replicated log. Celery:

```python
app.conf.task_queues = (
    Queue("orders", routing_key="orders", queue_arguments={"x-queue-type": "quorum"}),
)
```

[`rabbitmq-intermediate`](../rabbitmq-intermediate/README.md).

---

## Monitoring

- Management UI `:15673` on the stack
- `rabbitmqctl list_queues name messages consumers`
- Prometheus plugin — `deploy/rabbitmq`

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Wrong vhost in URL | ACCESS_REFUSED |
| Worker not listening to the queue | messages pile up |
| Memory alarm | flow control, publish blocked |

## Summary

RabbitMQ is the recommended Celery broker for reliability. Celery auto-manages most AMQP details. Monitor queue depth.

Next: [08-lab-rabbit-queues](08-lab-rabbit-queues.md).
