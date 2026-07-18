# 03. Порядок, ключи, масштабирование consumption

## Введение

«Нужен строгий порядок всех заказов» — при 50k RPS это **один** consumer. Порядок **всегда** платный. Вопрос: **по какому ключу** он нужен.

---

## Kafka: partition key

```text
key = order_id → все события заказа в одну partition → порядок внутри заказа
```

| Partition | Consumer в group | Параллелизм |
|-----------|------------------|-------------|
| N | до N | max N одновременных |

Увеличить throughput → **больше partition**, не «больше сообщений в одну».

---

## Rabbit: одна queue

Порядок **FIFO** в одной queue. Scale-out → **несколько consumers** на queue → порядок **не гарантирован** глобально.

**Consistent hash exchange** — shard по ключу в несколько queue.

---

## SQS

| Тип | Порядок | Throughput |
|-----|---------|------------|
| Standard | best-effort | очень высокий |
| FIFO | strict per MessageGroupId | 300 msg/s (без batch) |

`MessageGroupId` = аналог partition key.

---

## Redis Streams

Consumer group: сообщения в stream ID order; **несколько** consumers делят stream через pending entries.

Подходит для **умеренного** throughput, не для petabyte log.

---

## Hot partition / hot key

Один ключ → одна partition → bottleneck. Решения:

- субключи (shard order_id);
- async aggregation;
- отделить «горячий» путь.

---

## Резюме

Порядок = **scope по ключу**. Масштаб = **больше shard** (partition, queue, group id).

---

## Чек-лист

- [ ] Какой ключ порядка для заказа?
- [ ] Сколько partition нужно при 10 consumers?
- [ ] FIFO SQS хватит по RPS?

**Дальше:** [04. Kafka](04-kafka.md).
