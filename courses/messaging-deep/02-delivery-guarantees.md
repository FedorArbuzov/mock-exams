# 02. Гарантии доставки и идемпотентность

## Введение

«Exactly-once delivery» на билборде — **ложь** в распределённой системе без оговорок. Реальность: **at-most-once**, **at-least-once**, **effectively-once** (идемпотентный consumer + dedup).

---

## Три семантики

| Семантика | Что может случиться | Пример |
|-----------|---------------------|--------|
| **At-most-once** | потеря | fire-and-forget publish |
| **At-least-once** | дубликат | ack после обработки, crash до ack |
| **Exactly-once** (end-to-end) | дорого, узкий scope | Kafka EOS + transactional DB в одном pipeline |

**Практика:** проектируйте **at-least-once** + **идемпотентность**.

---

## Идемпотентный consumer

```text
message id = order_id + event_type
if processed_ids.contains(id): return OK
else: apply side effect; store id
```

Хранилище dedup: Redis SET, DB unique key, DynamoDB conditional write.

---

## По брокерам

| Брокер | Producer | Consumer |
|--------|----------|----------|
| **Kafka** | `acks=all`, idempotent producer | commit offset **после** side effect |
| **Rabbit** | publisher confirms | manual ack **после** work |
| **SQS** | SendMessage OK | delete **после** work; visibility timeout |
| **Redis Streams** | XADD | XACK после work |

---

## Ordering vs duplicates

Строгий порядок **внутри ключа** (partition, FIFO group) **усложняет** scale-out. Глобальный порядок — почти всегда **антипаттерн**.

---

## В mock-exams

- [kafka-intermediate EOS](../kafka-intermediate/README.md)
- [rabbitmq-intermediate/07](../rabbitmq-intermediate/07-publisher-confirms.md)
- [aws-intermediate/07 DLQ](../aws-intermediate/07-sqs-dlq.md)

---

## Резюме

Гарантия — **договорённость на границе** producer/broker/consumer. Без идемпотентности at-least-once = баги в проде.

---

## Чек-лист

- [ ] Где храните dedup key?
- [ ] Ack до или после commit в БД?
- [ ] Что при повторной доставке SQS после visibility timeout?

**Дальше:** [03. Порядок и масштаб](03-ordering-scaling.md).
