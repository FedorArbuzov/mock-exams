# RabbitMQ — Basic

Базовый уровень: **зачем RabbitMQ**, **exchange / queue / binding**, **work queues**, **fanout**, **direct и topic routing**, **ack и prefetch**, **сравнение с Kafka и SQS**, **мини-проект маршрутизации уведомлений о заказе**.

**Предварительно:** базовый Linux и Docker ([`linux-basic`](../linux-basic/README.md) или [`linux-intermediate`](../linux-intermediate/README.md) — `docker compose`, `docker exec`, терминал). Полезно пройти [kafka-basic](../kafka-basic/README.md) (лог vs очередь) или хотя бы [18-vs-queues](../kafka-basic/18-vs-queues.md).

**Локально:** [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md) — `docker compose up -d`, с хоста:

| Сервис | URL / порт |
|--------|------------|
| AMQP | `localhost:5672` (`amqp://course:course@localhost:5672/`) |
| Management UI | [http://localhost:15672](http://localhost:15672) — `course` / `course` |
| Prometheus metrics | `http://localhost:15692/metrics` (опционально) |

CLI в контейнере **`mock-rabbitmq`**: `rabbitmqctl`, `rabbitmqadmin -u course -p course …`.

Smoke: `bash scripts/smoke.sh` в `deploy/rabbitmq`. Сниппеты: [`examples/publish-consume.sh`](examples/publish-consume.sh).

**Дальше:** [`rabbitmq-intermediate`](../rabbitmq-intermediate/README.md) (DLX, quorum, federation). Сравнение брокеров: [messaging-deep](../messaging-deep/README.md) (полный трек) или [kafka-basic/18](../kafka-basic/18-vs-queues.md) (кратко). AWS-очереди: [aws-intermediate/07-sqs-dlq](../aws-intermediate/07-sqs-dlq.md).

## Как читать главы

Каждый урок — **глава книги**, не шпаргалка. Рекомендуемый порядок внутри пары:

1. Прочитайте **теорию** (01, 02, 04…) — не пропускайте «типичные ошибки».
2. Откройте **лабу** (03, 05…) с поднятым стендом `docker compose up -d` в `deploy/rabbitmq`.
3. Выполняйте задания **по номерам**; сверяйте вывод с блоком «что увидите».
4. Если брокер не отвечает — [`deploy/rabbitmq/README.md`](../../deploy/rabbitmq/README.md) (healthcheck, `ACCESS_REFUSED`, binding).

**Структура теории:** введение (сценарий с работы) → что узнаете → концепции → пример на стенде → ошибки → в проде → резюме → чек-лист.

**Структура лабы:** цель → предварительно → задания 1…N (зачем / команды / что увидите) → критерии успеха.

**Время:** около **40–50 минут** на пару «теория + лаба»; [финальный проект](13-final-project.md) — **2–3 часа**.

**Шпаргалка подключения:**

| Откуда | Адрес |
|--------|--------|
| AMQP с хоста | `amqp://course:course@localhost:5672/` |
| Management UI | [localhost:15672](http://localhost:15672) |
| Внутри Docker-сети | `amqp://course:course@rabbitmq:5672/` |
| `rabbitmqadmin` / `rabbitmqctl` | `docker exec mock-rabbitmq …` |

## Программа

### Основы (01–03)

1. [Зачем RabbitMQ: очереди, Kafka, SQS](01-why-rabbitmq.md)
2. [Архитектура: broker, exchange, queue, binding](02-architecture.md)
3. [Лаба: первая очередь и binding](03-lab-first-queue.md)

### Work queues (04–05)

4. [Work queues: competing consumers](04-work-queues.md) · 5. [Лаба: work queue](05-lab-work-queue.md)

### Pub/Sub (06–07)

6. [Pub/Sub: fanout exchange](06-pubsub-fanout.md) · 7. [Лаба: fanout](07-lab-fanout.md)

### Routing (08–09)

8. [Routing: direct и topic](08-routing-direct-topic.md) · 9. [Лаба: direct и topic](09-lab-routing.md)

### Надёжность (10–11)

10. [Ack, nack и prefetch](10-ack-prefetch.md) · 11. [Лаба: ack и nack](11-lab-ack-nack.md)

### Сравнение и финал (12–13)

12. [RabbitMQ vs Kafka vs SQS (собеседование)](12-vs-kafka-sqs.md)
13. [Финальный проект: уведомления о заказе](13-final-project.md)

## Что должно получиться

- Объясняете, **когда RabbitMQ**, а когда **Kafka** или **SQS** (с отсылкой к [kafka-basic/18](../kafka-basic/18-vs-queues.md)).
- Объявляете **exchange**, **queue**, **binding** и публикуете с **routing key**.
- Строите **work queue** с несколькими consumer и понимаете **round-robin**.
- Делаете **fanout** для рассылки одного события в несколько очередей.
- Маршрутизируете через **direct** и **topic** (`*` и `#`).
- Настраиваете **manual ack**, **nack/requeue** и **prefetch**.
- Собираете **маршрутизацию уведомлений** по заказу (финальный проект).

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/publish-consume.sh`](examples/publish-consume.sh) | функции publish/get для лаб (source из bash) |
