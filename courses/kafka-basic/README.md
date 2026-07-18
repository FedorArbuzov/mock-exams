# Kafka — Basic

Базовый уровень: **зачем Kafka**, **топики и партиции**, **producer/consumer**, **retention**, **сериализация**, **паттерны**, **lag и CLI**.

**Предварительно:** базовый Linux и Docker ([`linux-basic`](../linux-basic/README.md) или [`linux-intermediate`](../linux-intermediate/README.md) — достаточно `docker compose` и терминала).

**Локально:** [`deploy/kafka`](../../deploy/kafka/README.md) — `docker compose up -d`, bootstrap с хоста: **`localhost:9094`**, Kafka UI: [http://localhost:8080](http://localhost:8080).

**Дальше:** [`kafka-intermediate`](../kafka-intermediate/README.md) (репликация, Schema Registry, Connect), [`kafka-advanced`](../kafka-advanced/README.md).

## Как читать главы

Каждый урок — **глава книги**, не шпаргалка. Рекомендуемый порядок внутри пары:

1. Прочитайте **теорию** (01, 02, 04…) — не пропускайте введение и «типичные ошибки».
2. Откройте **лабу** (03-lab, 05-lab…) с поднятым стендом `docker compose up -d` в `deploy/kafka`.
3. Выполняйте задания **по номерам**; сверяйте вывод с блоком «что увидите».
4. Если что-то не сходится — [`deploy/kafka/README.md`](../../deploy/kafka/README.md) (healthcheck, порты, consumer group).

**Структура теории:** введение (сценарий с работы) → что узнаете → концепции → пример на стенде → ошибки → в проде → резюме → чек-лист.

**Структура лабы:** цель → предварительно → задания 1…N (зачем / команды / что увидите) → критерии успеха.

**Время:** около **40–50 минут** на пару «теория + лаба»; [финальный проект](19-final-project.md) — **2–3 часа**.

**Шпаргалка подключения:**

| Откуда | Bootstrap |
|--------|-----------|
| Хост (kcat, IDE) | `localhost:9094` |
| Внутри `mock-kafka` | `localhost:9092` |
| Kafka UI | внутри compose: `kafka:9092` |

CLI в контейнере: `/opt/kafka/bin/kafka-*.sh` (см. лабы).

## Программа

### Основы (01–03)

1. [Зачем Kafka](01-why-kafka.md)
2. [Архитектура: broker, topic, partition](02-architecture.md)
3. [Лаба: первый topic](03-lab-first-topic.md)

### Producer / Consumer (04–07)

4. [Producer: key, acks](04-producer.md) · 5. [Лаба: producer и ключи](05-lab-producer.md)
6. [Consumer: poll, group, offset](06-consumer.md) · 7. [Лаба: consumer group](07-lab-consumer.md)

### Хранение и данные (08–11)

8. [Retention и сегменты](08-retention.md) · 9. [Лаба: retention](09-lab-retention.md)
10. [Сериализация и Schema Registry](10-serialization.md) · 11. [Лаба: JSON-события](11-lab-serialization.md)

### Паттерны и надёжность (12–15)

12. [Паттерны: event, log aggregation](12-patterns.md) · 13. [Лаба: mini pipeline](13-lab-pipeline.md)
14. [Сбои: rebalance, дубли, lag](14-failures.md) · 15. [Лаба: consumer lag](15-lab-lag.md)

### Операции и сравнение (16–19)

16. [CLI: topics, groups](16-cli.md) · 17. [Лаба: describe и offsets](17-lab-cli.md)
18. [Kafka vs RabbitMQ vs SQS](18-vs-queues.md)
19. [Финальный проект](19-final-project.md)

## Что должно получиться

- Объясняете, чем **лог событий** отличается от **очереди задач**.
- Создаёте topic, пишете и читаете сообщения через CLI и kcat.
- Понимаете **partition**, **offset**, **consumer group** и **lag**.
- Настраиваете короткий **retention** и отправляете **JSON-события**.
- Собираете простой **pipeline** из двух топиков и диагностируете через **Kafka UI** и CLI.

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/events/order-created.json`](examples/events/order-created.json) | образец доменного события для лаб 11 и 19 |
