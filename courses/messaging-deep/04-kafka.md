# 04. Apache Kafka: log, retention, groups

## Введение

Kafka — **distributed commit log**, не «очередь задач». Сообщение **не исчезает** после read; consumer group хранит **offset**.

Расширяет [kafka-basic/18](../kafka-basic/18-vs-queues.md); hands-on — [kafka-*](../kafka-basic/README.md), [`deploy/kafka`](../../deploy/kafka/README.md).

---

## Когда Kafka — да

| Сценарий | Почему |
|----------|--------|
| Event backbone | много подписчиков на **историю** |
| CDC / Debezium | changelog в log |
| Stream processing | Flink, Kafka Streams |
| Replay после бага | reset offset |
| Высокий ingest | partition scale |

---

## Когда Kafka — нет

| Сценарий | Альтернатива |
|----------|--------------|
| Простая task queue | SQS, Rabbit |
| Малый MVP без ops | SQS |
| Request-reply с таймаутом | HTTP, Rabbit RPC |
| «Прочитал и забыл» | queue |

---

## Ключевые концепты

| Термин | Смысл |
|--------|--------|
| Topic | логический поток |
| Partition | shard лога, unit of order |
| Offset | позиция consumer |
| Consumer group | competing consumers **делят** partition |
| Retention | time/size — сколько хранить |
| Compaction | log cleanup по key (changelog) |

---

## MSK / self-hosted

| | Self-hosted | Amazon MSK |
|---|-------------|------------|
| Ops | ваша | AWS managed brokers |
| Cost | infra + люди | hourly + storage |
| Integrations | любые | IAM, CloudWatch |

[kafka-advanced/11](../kafka-advanced/11-managed-kafka.md).

---

## Типичные ошибки

- Один partition на high-traffic topic.
- Commit offset **до** записи в БД.
- «Удалим сообщение из Kafka» — не та модель; используйте tombstone + compaction или отдельный topic.

---

## Резюме

Kafka — **центральная нервная система** данных в движении. Цена — **операции** и **дисциплина** consumer.

---

## Чек-лист

- [ ] Сколько consumer groups на topic `orders`?
- [ ] Retention 7d достаточен для replay?
- [ ] Partition key выбран?

**Дальше:** [05. RabbitMQ](05-rabbitmq.md).
