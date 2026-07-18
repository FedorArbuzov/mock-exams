# 09. Мониторинг RabbitMQ: Management API, Prometheus, runbook

## Введение: «UI зелёный, а заказы копятся в DLQ»

Management UI показывает, что **nodes running**, но бизнес не получает уведомления. Оператору нужны **числа**: глубина очереди, rate publish/deliver, **unacked**, алармы на **DLQ**, диск под quorum journal. На стенде [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md) включены плагины **`rabbitmq_management`** и **`rabbitmq_prometheus`** — метрики на **`localhost:15692/metrics`**.

Сравните с [Kafka monitoring](../kafka-intermediate/17-monitoring.md): там lag по consumer group; здесь — **messages_ready** и **messages_unacknowledged**.

## Что вы узнаете

- **Management HTTP API** и UI.
- **rabbitmqctl** / **rabbitmq-diagnostics** для инцидентов.
- **Prometheus** endpoint и ключевые метрики.
- Алерты на DLQ, memory/disk alarm.
- Runbook «растёт очередь».

---

## Management UI

| URL | Назначение |
|-----|------------|
| [http://localhost:15672](http://localhost:15672) | Overview, Queues, Connections |
| `/api/overview` | JSON для скриптов |
| `/api/queues/{vhost}/{name}` | детали очереди |

Аутентификация на стенде: `course` / `course`.

Полезные поля очереди:

- `messages_ready` — ждут consumer
- `messages_unacknowledged` — взяты, но не ack
- `message_stats.publish_details.rate` — ingress

## Management API (curl)

```bash
curl -s -u course:course http://localhost:15672/api/queues/%2F/orders.dlq | jq '.messages,.messages_ready'
```

Список очередей с DLQ в имени:

```bash
curl -s -u course:course 'http://localhost:15672/api/queues/%2F' | jq '.[].name'
```

## rabbitmqctl

```bash
docker exec mock-rabbitmq rabbitmqctl list_queues name messages consumers memory
docker exec mock-rabbitmq rabbitmqctl list_connections user peer_host state
docker exec mock-rabbitmq rabbitmq-diagnostics check_running
docker exec mock-rabbitmq rabbitmq-diagnostics status
```

При **memory alarm** брокер блокирует publishers (`flow` в connections).

## Prometheus (:15692)

Конфиг стенда: [`deploy/rabbitmq/config/rabbitmq.conf`](../../deploy/rabbitmq/config/rabbitmq.conf) — `prometheus.tcp.port = 15692`.

```bash
curl -s http://localhost:15692/metrics | head -20
```

Примеры метрик (имена могут слегка отличаться по версии):

| Метрика | Смысл |
|---------|--------|
| `rabbitmq_queue_messages_ready` | backlog |
| `rabbitmq_queue_messages_unacked` | зависшие у consumer |
| `rabbitmq_queue_messages_published_total` | counter ingress |
| `rabbitmq_connections` | число соединений |
| `rabbitmq_process_resident_memory_bytes` | RAM узла |

В Grafana ([observability-intermediate](../observability-intermediate/README.md)) — dashboard + alert `ready > N` на `orders.work`, `> 0` на `orders.dlq`.

## DLQ и SQS-параллель

| Сигнал | RabbitMQ | SQS |
|--------|----------|-----|
| Poison backlog | `orders.dlq` ready > 0 | [ApproximateNumberOfMessagesVisible на DLQ](../aws-intermediate/07-sqs-dlq.md) |
| Work backlog | `orders.work` ready растёт | main queue depth |

## Runbook: «очередь растёт»

1. **Где** растёт — work, DLQ, unacked?
2. **Consumers** — `consumers=0`? crashed? slow?
3. **Publish rate** vs **deliver rate** в UI.
4. **Unacked** высокий — consumer не ack / долгая обработка / prefetch слишком большой.
5. **DLQ** — разбор poison ([04-lab-dlx](04-lab-dlx.md)).
6. **Ресурсы** — disk, memory alarm; quorum raft state.

## Сравнение с Kafka lag drill

[18-lab-lag-drill](../kafka-intermediate/18-lab-lag-drill.md) — остановить consumer, нагрузить topic, смотреть LAG. Здесь в [10-lab-management-drill](10-lab-management-drill.md) — остановить consumer, publish в `orders.work`, смотреть `messages_ready`.

## Резюме

Три ноги observability: UI для человека, API для автоматизации, Prometheus для алертов. DLQ depth — обязательный алерт уровня P2.

## Чек-лист

- Порт Prometheus на стенде?
- Разница ready vs unacked?
- Какой API-запрос для глубины DLQ?
- Что проверить при memory alarm?

Следующий урок: [10-lab-management-drill.md](10-lab-management-drill.md).
