# 05. RabbitMQ: exchanges, routing, DLX

## Введение

RabbitMQ — **брокер сообщений AMQP** с гибким **routing**. Идеален, когда сообщение — **задача** или **команда**, а не вечный факт для аналитики.

[rabbitmq-basic/12](../rabbitmq-basic/12-vs-kafka-sqs.md) — краткое сравнение; практика — [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md).

---

## Exchanges

| Тип | Маршрутизация |
|-----|---------------|
| **direct** | routing key = binding key |
| **fanout** | всем очередям |
| **topic** | pattern `orders.*.created` |
| **headers** | по заголовкам |

```text
publisher → exchange → bindings → queues → consumers
```

---

## Когда Rabbit — да

- **Work queue** + prefetch + competing consumers.
- **Сложный routing** без кода в consumer.
- **TTL**, **priority**, **per-message** DLX.
- **RPC** (reply-to + correlation_id).
- On-prem / multi-cloud без AWS lock-in.

---

## Когда Rabbit — нет

- Новый сервис читает **историю за месяц**.
- Единый **petabyte** event lake.
- Команда **не хочет** ops Erlang cluster → SQS/MSK managed.

---

## Quorum queues (production)

Classic mirrors устаревают; **quorum queues** — RAFT, лучше durability.

[rabbitmq-intermediate](../rabbitmq-intermediate/README.md).

---

## Publisher confirms + consumer ack

| Этап | Гарантия |
|------|----------|
| confirm | брокер принял |
| manual ack | consumer завершил |

Оба нужны для надёжной цепочки.

---

## Резюме

Rabbit — **швейцарский нож routing** для сообщений-задач. Не заменяет **event log** Kafka.

---

## Чек-лист

- [ ] Какой exchange type для уведомлений EU/US?
- [ ] DLX настроен?
- [ ] Quorum или classic?

**Дальше:** [06. SQS](06-sqs.md).
