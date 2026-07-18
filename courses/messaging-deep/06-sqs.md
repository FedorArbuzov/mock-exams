# 06. Amazon SQS: visibility, FIFO, Lambda

## Введение

**SQS** — managed queue в AWS. Нет брокера для патчить; платите за запросы. Нет **replay** для нового consumer — принципиальное отличие от Kafka.

[aws-intermediate/07](../aws-intermediate/07-sqs-dlq.md), [aws-basic/09](../aws-basic/09-messaging.md).

---

## Standard vs FIFO

| | Standard | FIFO |
|---|----------|------|
| Порядок | best-effort | strict per MessageGroupId |
| Throughput | неограничен practically | 300 TPS (до 3000 batch) |
| Dedup | нет | ContentBasedDeduplication |
| Имя queue | любое | `.fifo` suffix |

---

## Visibility timeout

```text
consumer получил message → невидимо N секунд
  → успех: DeleteMessage
  → crash: снова видно → redelivery
```

Длинная обработка → **ChangeMessageVisibility** или **heartbeat** pattern.

**Не путать** с Rabbit ack — семантика похожа, API другой.

---

## Когда SQS — да

- Уже **AWS**, нужен serverless.
- **Lambda** event source mapping.
- Worker pool без истории.
- Decouple microservices без shared log.
- [image-platform](../aws-intermediate/projects/image-platform/) pipeline.

---

## Когда SQS — нет

- **Replay** для нового analytics.
- Сложный routing (много правил) → EventBridge + SQS targets.
- Multi-cloud primary path без AWS.

---

## SQS + SNS fan-out

```text
SNS topic → SQS queue A (email)
          → SQS queue B (sms)
          → Lambda
```

Каждая SQS — **своя** копия; не делят одну queue между типами workers.

---

## Резюме

SQS — **простота и managed**. Платите отсутствием log semantics.

---

## Чек-лист

- [ ] Standard или FIFO для заказов?
- [ ] Visibility timeout > p99 обработки?
- [ ] DLQ подключена?

**Дальше:** [07. Redis](07-redis-messaging.md).
