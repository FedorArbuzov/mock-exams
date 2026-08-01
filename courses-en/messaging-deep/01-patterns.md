# 01. Patterns: queue, pub/sub, log

## Intro

"We need a queue" often means three different things: **a task for a worker**, **a notification for subscribers**, or **an immutable feed of events**. Confusion at the start of an architecture costs more than picking the "wrong" broker.

---

## Three models

| Model | Metaphor | Consumption | After read |
|--------|---------|-------------|------------|
| **Queue** | task mailbox | one consumer takes it | message is **deleted** (or acked) |
| **Pub/Sub** | radio | all subscribers hear it | no history for latecomers |
| **Log** | archived newspaper | each reader has a bookmark (offset) | messages **remain** |

```text
Queue:     [M1][M2] → worker A takes M1 → [M2]

Pub/Sub:   publisher → {sub1, sub2} simultaneously, no backlog

Log:       partition [e1][e2][e3]
              ├─ group billing (offset)
              └─ group analytics (offset)
```

---

## Who uses which model

| Technology | Model |
|------------|--------|
| RabbitMQ queue | queue (+ exchanges for pub/sub routing) |
| SQS | queue |
| Kafka | **log** |
| Redis Pub/Sub | pub/sub (fire-and-forget) |
| Redis Streams | log-like (with consumer groups) |
| SNS | pub/sub push |
| EventBridge | event bus + rules |

---

## Work queue vs event streaming

**Work queue:** "process order #42" — once it succeeds, the message is no longer needed.

**Event streaming:** "order #42 created" — billing, warehouse, and analytics read it **independently**, possibly **later**.

| Question | Work queue | Event log |
|--------|------------|-----------|
| Does a new service need the history? | no | yes |
| How many subscribers per event? | one (or competing) | many groups |
| Deleted after processing? | yes | no (retention) |

---

## In mock-exams

| Pattern | Course |
|---------|------|
| Log | [kafka-basic](../kafka-basic/README.md) |
| Queue + routing | [rabbitmq-basic](../rabbitmq-basic/README.md) |
| Managed queue | [aws-intermediate/07](../aws-intermediate/07-sqs-dlq.md) |
| Redis | [redis-basic/16](../redis-basic/16-vs-memcached-kafka.md) |

---

## Summary

First name the **model**, then the **product**. Queue ≠ log — the main fork of this course.

---

## Checklist

- [ ] One work queue example from your own experience?
- [ ] One example where you need replay?
- [ ] Pub/Sub without persistence — when is it acceptable?

**Next:** [02. Delivery guarantees](02-delivery-guarantees.md).
