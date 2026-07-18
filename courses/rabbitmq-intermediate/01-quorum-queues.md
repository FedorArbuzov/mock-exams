# 01. Quorum-очереди: надёжность вместо classic mirrored

## Введение: «зеркальная очередь умерла вместе с нодой»

Долгие годы в RabbitMQ для HA использовали **classic mirrored queues** (политики `ha-mode`, `ha-sync-mode`). После сбоя лидера перераспределение зеркал могло занимать минуты; при split-brain и «висящих» несинхронизированных зеркалах операторы теряли сообщения или получали непредсказуемый порядок. С RabbitMQ 3.8+ команда разработки продвигает **quorum queues** — очереди на базе алгоритма **Raft**, встроенного в плагин `rabbitmq_quorum_queue`.

На intermediate вы не просто ставите `x-queue-type=quorum`, а понимаете: когда quorum обязателен, когда достаточно одного узла для лабы, и как это соотносится с **репликацией партиций в Kafka** и **отсутствием ordering в SQS Standard**.

## Что вы узнаете

- Отличие **classic** / **quorum** / устаревших **mirrored**.
- Аргументы **`x-queue-type=quorum`**, **`x-quorum-initial-group-size`**.
- Требования к **кластеру** (нечётное число узлов, Erlang cookie).
- Ограничения quorum (TTL per-message, priority, некоторые policy).
- Сравнение с [Kafka replication](../kafka-intermediate/01-replication.md).

---

## Почему quorum

| Аспект | Classic mirrored | Quorum |
|--------|------------------|--------|
| Консенсус | master + mirrors, ручные политики | Raft, встроенный лидер |
| Согласованность | зависит от sync mode | сильнее при majority |
| Статус | legacy для новых систем | рекомендуется для новых HA-очередей |
| Потребление | один consumer на очередь (как classic) | то же |

Quorum хранит метаданные и журнал на диске (**durable** по смыслу обязателен). Потеря **большинства** узлов кворума делает очередь недоступной — как потеря ISR majority в Kafka.

## Объявление очереди

Через Management API или AMQP при `queue.declare`:

```json
{
  "durable": true,
  "arguments": {
    "x-queue-type": "quorum",
    "x-quorum-initial-group-size": 3
  }
}
```

Готовый фрагмент: [`examples/quorum-queue-declare.json`](examples/quorum-queue-declare.json).

**`x-quorum-initial-group-size`** — сколько членов Raft-группы при создании (обычно = числу узлов кластера, не больше). На **single node** RabbitMQ 3.13 допускает quorum-очередь с group size 1 для обучения; в продакшене это **не** HA.

CLI в контейнере:

```bash
docker exec mock-rabbitmq rabbitmqctl add_vhost /lab 2>/dev/null || true
docker exec mock-rabbitmq rabbitmqctl set_permissions -p /lab course ".*" ".*" ".*"
```

```bash
docker exec mock-rabbitmq rabbitmqadmin -u course -p course declare queue \
  name=orders.quorum durable=true arguments='{"x-queue-type":"quorum"}'
```

## Кластерный стенд

Для настоящего HA поднимите [`deploy/rabbitmq/docker-compose.cluster.yml`](../../deploy/rabbitmq/docker-compose.cluster.yml) и выполните [`scripts/init-cluster.sh`](../../deploy/rabbitmq/scripts/init-cluster.sh):

```text
rabbit@rabbitmq-1  ← master узел кластера
rabbit@rabbitmq-2  ← join_cluster
rabbit@rabbitmq-3  ← join_cluster
```

Проверка:

```bash
docker exec mock-rabbitmq-1 rabbitmqctl cluster_status
```

Очередь, объявленная на любом узле кластера, реплицируется на участников Raft-группы.

## Ограничения (важно до проектирования)

- **Приоритетные** сообщения (`x-max-priority`) — не для quorum (см. главу 05 — classic для priority).
- **Per-message TTL** в classic sense — ограничен; планируйте **queue TTL** или DLX на classic.
- **Lazy mode** classic — не применяется.
- Размер очереди: следите за **disk** и `memory` alarms — как у брокеров Kafka.

## Сравнение с Kafka и SQS

| Система | Единица HA | «Ядовитое» сообщение |
|---------|------------|----------------------|
| RabbitMQ quorum | очередь (Raft group) | DLX → DLQ (глава 03) |
| Kafka | partition replicas (ISR) | отдельный topic / retry + DLQ pattern |
| SQS | managed replicas (непрозрачно) | [DLQ после maxReceiveCount](../aws-intermediate/07-sqs-dlq.md) |

В Kafka порядок — в пределах **partition**; в quorum-очереди RabbitMQ — **FIFO** для одного consumer (конкурирующие consumers делят работу, порядок не гарантирован между ними).

## Типичные ошибки

| Ошибка | Симптом | Решение |
|--------|---------|---------|
| Quorum на standalone «как в проде» | нет failover | 3-узловой cluster compose |
| `initial-group-size` > узлов кластера | declare fail | уменьшить или добавить узлы |
| Ждать priority на quorum | declare error | classic queue или другой дизайн |
| Путать quorum с federated/shovel | сообщения в другом DC | отдельные механизмы |

## В продакшене

- Новые критичные очереди — **quorum**, 3 или 5 узлов (нечётное).
- Мониторинг: `rabbitmq_queue_messages_ready`, состояние Raft — глава 09.
- Миграция с mirrored: планируйте **новую очередь + dual write / drain**, не «на горячую».

## Резюме

Quorum-очереди — стандарт HA в современном RabbitMQ. Для курса: объявление с `x-queue-type=quorum`, опционально cluster + `init-cluster.sh`, понимание trade-offs против classic.

## Чек-лист

- Зачем quorum вместо mirrored?
- Что делает `x-quorum-initial-group-size`?
- Можно ли quorum на одном узле в лабе?
- Чем HA очереди RabbitMQ отличается от RF partition в Kafka?

Следующий урок: [02-lab-quorum.md](02-lab-quorum.md).
