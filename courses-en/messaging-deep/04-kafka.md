# 04. Apache Kafka: log, retention, groups

## Intro

Kafka is a **distributed commit log**, not a "task queue". A message **does not disappear** after a read; the consumer group stores an **offset**.

Extends [kafka-basic/18](../kafka-basic/18-vs-queues.md); hands-on — [kafka-*](../kafka-basic/README.md), [`deploy/kafka`](../../deploy/kafka/README.md).

---

## When Kafka — yes

| Scenario | Why |
|----------|--------|
| Event backbone | many subscribers to the **history** |
| CDC / Debezium | changelog in a log |
| Stream processing | Flink, Kafka Streams |
| Replay after a bug | reset offset |
| High ingest | partition scale |

---

## When Kafka — no

| Scenario | Alternative |
|----------|--------------|
| Simple task queue | SQS, Rabbit |
| Small MVP without ops | SQS |
| Request-reply with a timeout | HTTP, Rabbit RPC |
| "Read it and forget" | queue |

---

## Key concepts

| Term | Meaning |
|--------|--------|
| Topic | logical stream |
| Partition | shard of the log, unit of order |
| Offset | consumer position |
| Consumer group | competing consumers **split** the partitions |
| Retention | time/size — how long to keep |
| Compaction | log cleanup by key (changelog) |

---

## MSK / self-hosted

| | Self-hosted | Amazon MSK |
|---|-------------|------------|
| Ops | yours | AWS managed brokers |
| Cost | infra + people | hourly + storage |
| Integrations | any | IAM, CloudWatch |

[kafka-advanced/11](../kafka-advanced/11-managed-kafka.md).

---

## Common mistakes

- One partition on a high-traffic topic.
- Committing the offset **before** writing to the DB.
- "Let's delete the message from Kafka" — wrong model; use a tombstone + compaction or a separate topic.

---

## Summary

Kafka is the **central nervous system** for data in motion. The price is **operations** and consumer **discipline**.

---

## Checklist

- [ ] How many consumer groups on the `orders` topic?
- [ ] Is 7d retention enough for replay?
- [ ] Is the partition key chosen?

**Next:** [05. RabbitMQ](05-rabbitmq.md).
