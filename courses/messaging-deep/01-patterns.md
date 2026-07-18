# 01. Паттерны: queue, pub/sub, log

## Введение

«Нам нужна очередь» — часто имеют в виду три разные вещи: **задачу воркеру**, **уведомление подписчикам** или **неизменяемую ленту событий**. Путаница на старте архитектуры стоит дороже, чем выбор «не того» брокера.

---

## Три модели

| Модель | Метафора | Потребление | После read |
|--------|---------|-------------|------------|
| **Queue** | почтовый ящик задач | один consumer забирает | сообщение **удаляется** (или ack) |
| **Pub/Sub** | радио | все подписчики слышат | нет истории для опоздавших |
| **Log** | газета в архиве | каждый читатель с закладкой (offset) | сообщения **остаются** |

```text
Queue:     [M1][M2] → worker A забирает M1 → [M2]

Pub/Sub:   publisher → {sub1, sub2} одновременно, без backlog

Log:       partition [e1][e2][e3]
              ├─ group billing (offset)
              └─ group analytics (offset)
```

---

## Кто на какой модели

| Технология | Модель |
|------------|--------|
| RabbitMQ queue | queue (+ exchanges для pub/sub routing) |
| SQS | queue |
| Kafka | **log** |
| Redis Pub/Sub | pub/sub (fire-and-forget) |
| Redis Streams | log-like (с consumer groups) |
| SNS | pub/sub push |
| EventBridge | event bus + rules |

---

## Work queue vs event streaming

**Work queue:** «обработай заказ #42» — после успеха сообщение не нужно.

**Event streaming:** «заказ #42 создан» — billing, warehouse, analytics читают **независимо**, возможно **позже**.

| Вопрос | Work queue | Event log |
|--------|------------|-----------|
| Нужна история новому сервису? | нет | да |
| Сколько подписчиков на событие? | один (или competing) | много groups |
| Удаление после обработки? | да | нет (retention) |

---

## В mock-exams

| Паттерн | Курс |
|---------|------|
| Log | [kafka-basic](../kafka-basic/README.md) |
| Queue + routing | [rabbitmq-basic](../rabbitmq-basic/README.md) |
| Managed queue | [aws-intermediate/07](../aws-intermediate/07-sqs-dlq.md) |
| Redis | [redis-basic/16](../redis-basic/16-vs-memcached-kafka.md) |

---

## Резюме

Сначала назовите **модель**, потом **продукт**. Queue ≠ log — главный развилка курса.

---

## Чек-лист

- [ ] Один пример work queue из вашего опыта?
- [ ] Один пример, где нужен replay?
- [ ] Pub/Sub без persistence — когда допустим?

**Дальше:** [02. Гарантии доставки](02-delivery-guarantees.md).
