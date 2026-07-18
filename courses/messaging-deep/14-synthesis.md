# 14. Синтез: decision matrix

## Практическое задание

Выберите продукт:

- [image-platform](../aws-intermediate/projects/image-platform/) (upload → process → notify), или
- свой сервис.

### Deliverable: ADR «Messaging backbone» (2–3 ч)

**1. Requirements table**

| Требование | Приоритет | Значение |
|------------|-----------|----------|
| Throughput | | events/day |
| Replay | да/нет | |
| Fan-out consumers | N | |
| Ordering key | | |
| Cloud | AWS/on-prem | |
| Team ops maturity | | |

**2. Decision matrix**

Оцените **Kafka, Rabbit, SQS, Redis Streams, EventBridge** (1–5 или Low/Med/High fit):

| Критерий | Kafka | Rabbit | SQS | Redis Streams | EventBridge |
|----------|-------|--------|-----|---------------|-------------|
| Replay | | | | | |
| Routing | | | | | |
| Ops burden | | | | | |
| Cost | | | | | |
| AWS native | | | | | |

**3. Recommendation**

- **Primary bus:** …
- **Secondary (tasks):** …
- **Rejected:** … с одной строкой почему

**4. Diagram**

```text
[ producers ] → [ ? ] → [ consumers ]
```

**5. Operational checklist**

- DLQ: …
- Idempotency key: …
- Key metrics: …

---

## Мастер-таблица курса

| Нужно | Выбор |
|-------|-------|
| Event log, replay, many subscribers | **Kafka** |
| Complex routing, task queue | **Rabbit** |
| AWS serverless, simple queue | **SQS** |
| Low latency, small volume, already Redis | **Streams** (не Pub/Sub для critical) |
| AWS routing, schedules, SaaS integration | **EventBridge** |
| Fan-out push в AWS | **SNS** + SQS/Lambda |

---

## Карта курса

```text
01–03  Модели, гарантии, порядок
04–08  Kafka, Rabbit, SQS, Redis, AWS
09–11  DLQ, outbox, гибриды
12–14  Interview, ops, ADR
```

---

## В mock-exams — практика

| Брокер | Курс |
|--------|------|
| Kafka | [kafka-basic](../kafka-basic/README.md) → [advanced](../kafka-advanced/README.md) |
| Rabbit | [rabbitmq-basic](../rabbitmq-basic/README.md) |
| SQS | [aws-intermediate/07](../aws-intermediate/07-sqs-dlq.md) |
| Redis | [redis-basic](../redis-basic/README.md) |
| Compare intro | [kafka-basic/18](../kafka-basic/18-vs-queues.md) |

---

## Резюме

Курс завершён, когда **ADR** защищён перед коллегой: альтернативы названы, trade-offs честны, ops не забыты.
