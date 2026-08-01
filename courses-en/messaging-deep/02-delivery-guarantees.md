# 02. Delivery guarantees and idempotency

## Intro

"Exactly-once delivery" on a billboard is a **lie** in a distributed system without caveats. The reality: **at-most-once**, **at-least-once**, **effectively-once** (idempotent consumer + dedup).

---

## Three semantics

| Semantics | What can happen | Example |
|-----------|---------------------|--------|
| **At-most-once** | loss | fire-and-forget publish |
| **At-least-once** | duplicate | ack after processing, crash before ack |
| **Exactly-once** (end-to-end) | expensive, narrow scope | Kafka EOS + transactional DB in one pipeline |

**In practice:** design for **at-least-once** + **idempotency**.

---

## Idempotent consumer

```text
message id = order_id + event_type
if processed_ids.contains(id): return OK
else: apply side effect; store id
```

Dedup storage: Redis SET, DB unique key, DynamoDB conditional write.

---

## By broker

| Broker | Producer | Consumer |
|--------|----------|----------|
| **Kafka** | `acks=all`, idempotent producer | commit offset **after** side effect |
| **Rabbit** | publisher confirms | manual ack **after** work |
| **SQS** | SendMessage OK | delete **after** work; visibility timeout |
| **Redis Streams** | XADD | XACK after work |

---

## Ordering vs duplicates

Strict ordering **within a key** (partition, FIFO group) **complicates** scale-out. Global ordering is almost always an **anti-pattern**.

---

## In mock-exams

- [kafka-intermediate EOS](../kafka-intermediate/README.md)
- [rabbitmq-intermediate/07](../rabbitmq-intermediate/07-publisher-confirms.md)
- [aws-intermediate/07 DLQ](../aws-intermediate/07-sqs-dlq.md)

---

## Summary

A guarantee is an **agreement at the boundary** of producer/broker/consumer. Without idempotency, at-least-once = bugs in production.

---

## Checklist

- [ ] Where do you store the dedup key?
- [ ] Ack before or after the DB commit?
- [ ] What happens on SQS redelivery after the visibility timeout?

**Next:** [03. Ordering and scale](03-ordering-scaling.md).
