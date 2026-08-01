# Messaging Deep

A theory course on **"which broker, when"**: **Kafka**, **RabbitMQ**, **Redis Streams**, **Amazon SQS**, plus **EventBridge/SNS** in AWS. A "book"-style format, **with no new lab environment** — practice lives in existing courses and `deploy/*`.

**Who it's for:** backend / DevOps / platform engineers after the introductory queue courses; anyone preparing for **system design** and event architecture choices.

**Prerequisites (at least one, preferably two):**

| Course | Why |
|------|--------|
| [kafka-basic/18](../kafka-basic/18-vs-queues.md) | quick Kafka/Rabbit/SQS comparison |
| [aws-intermediate/07](../aws-intermediate/07-sqs-dlq.md) | SQS, DLQ |
| [rabbitmq-basic](../rabbitmq-basic/README.md) or [redis-basic](../redis-basic/README.md) | queue vs data structures |

**Useful:** [kafka-intermediate](../kafka-intermediate/README.md), [aws-intermediate/09 EventBridge](../aws-intermediate/09-eventbridge.md), [redis-intermediate/13](../redis-intermediate/13-reliability.md).

## How to read

- Chapters **01–12** — ~**35–50 min** each.
- The **"In mock-exams"** block — where to go for hands-on.
- [Finale](14-synthesis.md) — a **decision record** for one product (**2–3 h**).

**Time:** ~**12–16 hours**.

## Curriculum

### Part I — Models and guarantees (01–03)

| # | Chapter |
|---|--------|
| 01 | [Patterns: queue, pub/sub, log](01-patterns.md) |
| 02 | [Delivery guarantees and idempotency](02-delivery-guarantees.md) |
| 03 | [Ordering, keys, scaling consumption](03-ordering-scaling.md) |

### Part II — Brokers (04–08)

| # | Chapter |
|---|--------|
| 04 | [Apache Kafka: log, retention, groups](04-kafka.md) |
| 05 | [RabbitMQ: exchanges, routing, DLX](05-rabbitmq.md) |
| 06 | [Amazon SQS: visibility, FIFO, Lambda](06-sqs.md) |
| 07 | [Redis: Pub/Sub, Lists, Streams](07-redis-messaging.md) |
| 08 | [AWS EventBridge, SNS and hybrids](08-aws-eventing.md) |

### Part III — Architecture (09–12)

| # | Chapter |
|---|--------|
| 09 | [Dead letter and poison messages](09-dlq-patterns.md) |
| 10 | [Outbox, inbox, transactional messaging](10-outbox-saga.md) |
| 11 | [Hybrid designs and migrations](11-hybrid-migration.md) |
| 12 | [System design and interviews](12-system-design.md) |

### Part IV — Synthesis (13–14)

| # | Chapter |
|---|--------|
| 13 | [Ops, cost, observability of brokers](13-ops-cost-observability.md) |
| 14 | [Synthesis: decision matrix](14-synthesis.md) |

## Lab environments (optional, not required for the course)

| Broker | Practice |
|--------|----------|
| Kafka | [`deploy/kafka`](../../deploy/kafka/README.md) — [kafka-basic](../kafka-basic/README.md) |
| RabbitMQ | [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md) — [rabbitmq-*](../rabbitmq-basic/README.md) |
| Redis | [`deploy/redis`](../../deploy/redis/README.md) — [redis-*](../redis-basic/README.md) |
| SQS / EventBridge | [aws-intermediate](../aws-intermediate/README.md), LocalStack |

## What you should end up with

- You choose a broker based on **replay, fan-out, routing, cloud, ops** — not on hype.
- You explain why **Redis Pub/Sub** does not replace Kafka for billing.
- You design a **DLQ** and an idempotent consumer for SQS and Rabbit.
- You write an **ADR** for an "order event bus" with alternatives.

## Related to kafka-basic/18

[18-vs-queues](../kafka-basic/18-vs-queues.md) is an **introductory chapter** of one course. **Messaging Deep** is the full track with Redis Streams, EventBridge, outbox and system design.
