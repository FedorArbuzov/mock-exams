# 13. Ops, cost, observability of brokers

## Intro

"We chose Kafka" — a year later, **three FTE** on KRaft, rebalances, tiered storage. Choosing a broker = **TCO** + **on-call**.

[finops](../finops/README.md), [observability-*](../observability-basic/README.md).

---

## Ops comparison (simplified)

| | Kafka | Rabbit | SQS | Redis Streams |
|---|-------|--------|-----|---------------|
| Patching | you | you | AWS | you |
| Scaling | brokers, partitions | nodes, queues | automatic | memory/cluster |
| Upgrade | rolling, KRaft | Erlang cluster | none | Redis upgrade |
| Backup | mirror, tiered | definitions export | n/a | RDB/AOF |

---

## Cost drivers

| Kafka (MSK) | SQS |
|-------------|-----|
| broker hours | per million requests |
| storage | data transfer |
| cross-AZ | |

| Rabbit | Redis |
|--------|-------|
| VMs + HA | RAM size |

[finops/08 NAT](../finops/08-storage-network-cost.md) — transfer from consumers into the cloud.

---

## Metrics

| Kafka | Rabbit | SQS |
|-------|--------|-----|
| consumer lag | queue depth | ApproximateAgeOfOldestMessage |
| under-replicated partitions | memory alarm | DLQ depth |
| request rate | unacked messages | |

Alert on **lag/age**, not just "broker up".

---

## Runbooks

- lag growing → scale consumers / add partitions (you can't easily reduce the partition count!)
- DLQ spike → stop the replay storm; fix the root cause
- broker disk full → retention, tiered storage

[observability-advanced runbooks](../observability-advanced/README.md).

---

## Summary

Managed (SQS, EventBridge) buys **ops** at the cost of **flexibility**. Self-hosted buys **control** at the cost of **people**.

---

## Checklist

- [ ] Who is on-call for the broker?
- [ ] Are lag/depth in Grafana?
- [ ] Is the cost line item known?

**Next:** [14. Synthesis](14-synthesis.md).
