# 08. AWS EventBridge, SNS и гибриды

## Введение

В AWS messaging — не только SQS. **EventBridge** — доменная **шина событий** с правилами; **SNS** — fan-out push. Часто **комбинируют** с SQS и Lambda.

[aws-intermediate/09](../aws-intermediate/09-eventbridge.md), [aws-intermediate/10-lab](../aws-intermediate/10-lab-eventbridge.md).

---

## SNS vs SQS vs EventBridge

| | SNS | SQS | EventBridge |
|---|-----|-----|-------------|
| Модель | pub/sub push | pull queue | event bus + rules |
| Фильтрация | мало | нет | **event pattern** JSON |
| Schedule | нет | нет | **cron** rules |
| Targets | HTTP, SQS, Lambda, … | consumers | 20+ AWS + API destinations |

---

## Типичный паттерн

```text
Order service → EventBridge (custom bus)
                    ├─ rule: ImageUploaded → Lambda resize
                    ├─ rule: OrderPaid → SQS → worker
                    └─ rule: audit → CloudWatch Logs
```

**Не дублируйте** одно событие в Kafka и EventBridge без причины — выберите **primary bus**.

---

## EventBridge vs Kafka (MSK)

| | EventBridge | Kafka/MSK |
|---|-------------|-----------|
| Ops | serverless | cluster |
| Replay | archive + replay (опции) | native retention |
| Volume cost | per event | per broker hour |
| Cross-account | buses, policies | MirrorMaker / cluster link |

---

## Kinesis (кратко)

**Kinesis Data Streams** — shard-based log в AWS, ближе к Kafka по модели. Выбор: уже Kafka skills → MSK; чистый AWS → Kinesis vs MSK trade-off (cost, limits, connectors).

---

## Резюме

AWS — **композиция** сервисов. EventBridge для **routing**; SQS для **buffer**; MSK для **heavy streaming**.

---

## Чек-лист

- [ ] Custom bus или default?
- [ ] Event pattern vs SNS fan-out?
- [ ] Нужен ли MSK в том же аккаунте?

**Дальше:** [09. DLQ](09-dlq-patterns.md).
