# 13. Ops, cost, observability брокеров

## Введение

«Выбрали Kafka» — через год **три FTE** на KRaft, rebalance, tiered storage. Выбор брокера = **TCO** + **on-call**.

[finops](../finops/README.md), [observability-*](../observability-basic/README.md).

---

## Ops сравнение (упрощённо)

| | Kafka | Rabbit | SQS | Redis Streams |
|---|-------|--------|-----|---------------|
| Патчинг | вы | вы | AWS | вы |
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

[finops/08 NAT](../finops/08-storage-network-cost.md) — transfer из consumers в cloud.

---

## Метрики

| Kafka | Rabbit | SQS |
|-------|--------|-----|
| consumer lag | queue depth | ApproximateAgeOfOldestMessage |
| under-replicated partitions | memory alarm | DLQ depth |
| request rate | unacked messages | |

Алерты на **lag/age**, не только «broker up».

---

## Runbooks

- lag growing → scale consumers / add partitions (нельзя уменьшить partition count легко!)
- DLQ spike → stop replay storm; fix root cause
- broker disk full → retention, tiered storage

[observability-advanced runbooks](../observability-advanced/README.md).

---

## Резюме

Managed (SQS, EventBridge) покупает **ops** ценой **гибкости**. Self-hosted покупает **контроль** ценой **людей**.

---

## Чек-лист

- [ ] Кто on-call на брокер?
- [ ] Lag/depth в Grafana?
- [ ] Cost line item известен?

**Дальше:** [14. Синтез](14-synthesis.md).
