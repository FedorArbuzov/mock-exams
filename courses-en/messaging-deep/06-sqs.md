# 06. Amazon SQS: visibility, FIFO, Lambda

## Intro

**SQS** is a managed queue in AWS. There is no broker to patch; you pay per request. There is no **replay** for a new consumer — a fundamental difference from Kafka.

[aws-intermediate/07](../aws-intermediate/07-sqs-dlq.md), [aws-basic/09](../aws-basic/09-messaging.md).

---

## Standard vs FIFO

| | Standard | FIFO |
|---|----------|------|
| Ordering | best-effort | strict per MessageGroupId |
| Throughput | practically unlimited | 300 TPS (up to 3000 with batch) |
| Dedup | no | ContentBasedDeduplication |
| Queue name | anything | `.fifo` suffix |

---

## Visibility timeout

```text
consumer received a message → invisible for N seconds
  → success: DeleteMessage
  → crash: visible again → redelivery
```

Long processing → **ChangeMessageVisibility** or a **heartbeat** pattern.

**Don't confuse** it with Rabbit ack — the semantics are similar, the API is different.

---

## When SQS — yes

- Already on **AWS**, need serverless.
- **Lambda** event source mapping.
- Worker pool without history.
- Decouple microservices without a shared log.
- [image-platform](../aws-intermediate/projects/image-platform/) pipeline.

---

## When SQS — no

- **Replay** for a new analytics service.
- Complex routing (many rules) → EventBridge + SQS targets.
- Multi-cloud primary path without AWS.

---

## SQS + SNS fan-out

```text
SNS topic → SQS queue A (email)
          → SQS queue B (sms)
          → Lambda
```

Each SQS gets **its own** copy; don't share one queue between different worker types.

---

## Summary

SQS is about **simplicity and being managed**. You pay for it with the lack of log semantics.

---

## Checklist

- [ ] Standard or FIFO for orders?
- [ ] Visibility timeout > p99 processing time?
- [ ] Is a DLQ attached?

**Next:** [07. Redis](07-redis-messaging.md).
