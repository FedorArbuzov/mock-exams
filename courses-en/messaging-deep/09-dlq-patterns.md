# 09. Dead letter and poison messages

## Intro

A **poison message** is a message that **always** fails (corrupt payload, bug, incompatible schema). Without a DLQ — endless redelivery and a **stalled** queue.

---

## By system

| System | Mechanism |
|---------|----------|
| **SQS** | redrive policy → DLQ after N receives |
| **Rabbit** | dead letter **exchange** (DLX) |
| **Kafka** | no native DLQ → a separate `*.dlq` topic or skip + store |
| **Redis Streams** | pending + manual claim; no DLQ standard |

---

## SQS DLQ

```hcl
maxReceiveCount = 3
dlq_arn = aws_sqs_queue.dlq.arn
```

Alarm on **ApproximateNumberOfMessagesVisible** in the DLQ.

[aws-intermediate/07](../aws-intermediate/07-sqs-dlq.md).

---

## Rabbit DLX

```text
main queue ──(reject/nack/expired)──► DLX exchange ──► dlq.queue
```

A separate consumer inspects the DLQ manually or reprocesses with a fix.

[rabbitmq-intermediate](../rabbitmq-intermediate/README.md).

---

## Kafka "DLQ pattern"

```text
consumer fails parse
  → produce to orders.parse.errors with original bytes + reason
  → commit offset (or pause partition)
```

**Don't block** a partition forever with one bad message — quarantine it.

---

## Operational runbook

1. Alert on DLQ depth.
2. Sample 10 messages — root cause.
3. Fix code / schema.
4. **Replay** from the DLQ (script) or discard with a ticket.

---

## Summary

A DLQ is a **quarantine**, not a dumping ground. A DLQ without monitoring is an anti-pattern.

---

## Checklist

- [ ] Is there a DLQ on all critical queues?
- [ ] Who is on-call for the DLQ alert?
- [ ] Is the Kafka error topic defined?

**Next:** [10. Outbox](10-outbox-saga.md).
