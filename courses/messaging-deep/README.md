# Messaging Deep

Теоретический курс **«какой брокер когда»**: **Kafka**, **RabbitMQ**, **Redis Streams**, **Amazon SQS**, плюс **EventBridge/SNS** в AWS. Формат «книги» на русском, **без нового стенда** — практика в существующих курсах и `deploy/*`.

**Для кого:** backend / DevOps / platform engineer после базовых курсов по очередям; те, кто готовит **system design** и выбор архитектуры событий.

**Предварительно (хотя бы один, лучше два):**

| Курс | Зачем |
|------|--------|
| [kafka-basic/18](../kafka-basic/18-vs-queues.md) | краткое сравнение Kafka/Rabbit/SQS |
| [aws-intermediate/07](../aws-intermediate/07-sqs-dlq.md) | SQS, DLQ |
| [rabbitmq-basic](../rabbitmq-basic/README.md) или [redis-basic](../redis-basic/README.md) | очередь vs структуры |

**Полезно:** [kafka-intermediate](../kafka-intermediate/README.md), [aws-intermediate/09 EventBridge](../aws-intermediate/09-eventbridge.md), [redis-intermediate/13](../redis-intermediate/13-reliability.md).

## Как читать

- Главы **01–12** — ~**35–50 мин** каждая.
- Блок **«В mock-exams»** — куда идти за hands-on.
- [Финал](14-synthesis.md) — **decision record** для одного продукта (**2–3 ч**).

**Время:** ~**12–16 часов**.

## Программа

### Часть I — Модели и гарантии (01–03)

| № | Глава |
|---|--------|
| 01 | [Паттерны: queue, pub/sub, log](01-patterns.md) |
| 02 | [Гарантии доставки и идемпотентность](02-delivery-guarantees.md) |
| 03 | [Порядок, ключи, масштабирование consumption](03-ordering-scaling.md) |

### Часть II — Брокеры (04–08)

| № | Глава |
|---|--------|
| 04 | [Apache Kafka: log, retention, groups](04-kafka.md) |
| 05 | [RabbitMQ: exchanges, routing, DLX](05-rabbitmq.md) |
| 06 | [Amazon SQS: visibility, FIFO, Lambda](06-sqs.md) |
| 07 | [Redis: Pub/Sub, Lists, Streams](07-redis-messaging.md) |
| 08 | [AWS EventBridge, SNS и гибриды](08-aws-eventing.md) |

### Часть III — Архитектура (09–12)

| № | Глава |
|---|--------|
| 09 | [Dead letter и poison messages](09-dlq-patterns.md) |
| 10 | [Outbox, inbox, transactional messaging](10-outbox-saga.md) |
| 11 | [Гибридные схемы и миграции](11-hybrid-migration.md) |
| 12 | [System design и собеседование](12-system-design.md) |

### Часть IV — Синтез (13–14)

| № | Глава |
|---|--------|
| 13 | [Ops, cost, observability брокеров](13-ops-cost-observability.md) |
| 14 | [Синтез: decision matrix](14-synthesis.md) |

## Стенды (опционально, не обязательны для курса)

| Брокер | Практика |
|--------|----------|
| Kafka | [`deploy/kafka`](../../deploy/kafka/README.md) — [kafka-basic](../kafka-basic/README.md) |
| RabbitMQ | [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md) — [rabbitmq-*](../rabbitmq-basic/README.md) |
| Redis | [`deploy/redis`](../../deploy/redis/README.md) — [redis-*](../redis-basic/README.md) |
| SQS / EventBridge | [aws-intermediate](../aws-intermediate/README.md), LocalStack |

## Что должно получиться

- Выбираете брокер по **replay, fan-out, routing, cloud, ops** — не по хайпу.
- Объясняете, почему **Redis Pub/Sub** не заменяет Kafka для billing.
- Проектируете **DLQ** и идемпотентный consumer для SQS и Rabbit.
- Оформляете **ADR** «шина событий заказов» с альтернативами.

## Связь с kafka-basic/18

[18-vs-queues](../kafka-basic/18-vs-queues.md) — **вводная глава** одного курса. **Messaging Deep** — полный трек с Redis Streams, EventBridge, outbox и system design.
