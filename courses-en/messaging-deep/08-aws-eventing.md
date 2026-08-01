# 08. AWS EventBridge, SNS and hybrids

## Intro

In AWS, messaging is more than just SQS. **EventBridge** is a domain **event bus** with rules; **SNS** is fan-out push. They are often **combined** with SQS and Lambda.

[aws-intermediate/09](../aws-intermediate/09-eventbridge.md), [aws-intermediate/10-lab](../aws-intermediate/10-lab-eventbridge.md).

---

## SNS vs SQS vs EventBridge

| | SNS | SQS | EventBridge |
|---|-----|-----|-------------|
| Model | pub/sub push | pull queue | event bus + rules |
| Filtering | limited | no | **event pattern** JSON |
| Schedule | no | no | **cron** rules |
| Targets | HTTP, SQS, Lambda, … | consumers | 20+ AWS + API destinations |

---

## A typical pattern

```text
Order service → EventBridge (custom bus)
                    ├─ rule: ImageUploaded → Lambda resize
                    ├─ rule: OrderPaid → SQS → worker
                    └─ rule: audit → CloudWatch Logs
```

**Don't duplicate** the same event into both Kafka and EventBridge without a reason — pick a **primary bus**.

---

## EventBridge vs Kafka (MSK)

| | EventBridge | Kafka/MSK |
|---|-------------|-----------|
| Ops | serverless | cluster |
| Replay | archive + replay (optional) | native retention |
| Volume cost | per event | per broker hour |
| Cross-account | buses, policies | MirrorMaker / cluster link |

---

## Kinesis (briefly)

**Kinesis Data Streams** is a shard-based log in AWS, closer to Kafka in model. The choice: already have Kafka skills → MSK; pure AWS → a Kinesis vs MSK trade-off (cost, limits, connectors).

---

## Summary

AWS is a **composition** of services. EventBridge for **routing**; SQS for **buffering**; MSK for **heavy streaming**.

---

## Checklist

- [ ] Custom bus or default?
- [ ] Event pattern vs SNS fan-out?
- [ ] Do you need MSK in the same account?

**Next:** [09. DLQ](09-dlq-patterns.md).
