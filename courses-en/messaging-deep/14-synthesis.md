# 14. Synthesis: decision matrix

## Practice task

Choose a product:

- [image-platform](../aws-intermediate/projects/image-platform/) (upload → process → notify), or
- your own service.

### Deliverable: an ADR "Messaging backbone" (2–3 h)

**1. Requirements table**

| Requirement | Priority | Value |
|------------|-----------|----------|
| Throughput | | events/day |
| Replay | yes/no | |
| Fan-out consumers | N | |
| Ordering key | | |
| Cloud | AWS/on-prem | |
| Team ops maturity | | |

**2. Decision matrix**

Rate **Kafka, Rabbit, SQS, Redis Streams, EventBridge** (1–5 or Low/Med/High fit):

| Criterion | Kafka | Rabbit | SQS | Redis Streams | EventBridge |
|----------|-------|--------|-----|---------------|-------------|
| Replay | | | | | |
| Routing | | | | | |
| Ops burden | | | | | |
| Cost | | | | | |
| AWS native | | | | | |

**3. Recommendation**

- **Primary bus:** …
- **Secondary (tasks):** …
- **Rejected:** … with one line explaining why

**4. Diagram**

```text
[ producers ] → [ ? ] → [ consumers ]
```

**5. Operational checklist**

- DLQ: …
- Idempotency key: …
- Key metrics: …

---

## Course master table

| Need | Choice |
|-------|-------|
| Event log, replay, many subscribers | **Kafka** |
| Complex routing, task queue | **Rabbit** |
| AWS serverless, simple queue | **SQS** |
| Low latency, small volume, already Redis | **Streams** (not Pub/Sub for critical paths) |
| AWS routing, schedules, SaaS integration | **EventBridge** |
| Fan-out push in AWS | **SNS** + SQS/Lambda |

---

## Course map

```text
01–03  Models, guarantees, ordering
04–08  Kafka, Rabbit, SQS, Redis, AWS
09–11  DLQ, outbox, hybrids
12–14  Interview, ops, ADR
```

---

## In mock-exams — practice

| Broker | Course |
|--------|------|
| Kafka | [kafka-basic](../kafka-basic/README.md) → [advanced](../kafka-advanced/README.md) |
| Rabbit | [rabbitmq-basic](../rabbitmq-basic/README.md) |
| SQS | [aws-intermediate/07](../aws-intermediate/07-sqs-dlq.md) |
| Redis | [redis-basic](../redis-basic/README.md) |
| Compare intro | [kafka-basic/18](../kafka-basic/18-vs-queues.md) |

---

## Summary

The course is complete when the **ADR** is defended in front of a colleague: alternatives are named, trade-offs are honest, and ops are not forgotten.
