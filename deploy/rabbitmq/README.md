# RabbitMQ для курсов rabbitmq-*

Локальный стенд: **RabbitMQ 3.13** + **Management UI** + **Prometheus metrics** (плагин).

Курсы: [rabbitmq-basic](../../courses/rabbitmq-basic/README.md), [rabbitmq-intermediate](../../courses/rabbitmq-intermediate/README.md).

## Запуск

```bash
cd deploy/rabbitmq
docker compose up -d
docker compose ps
```

| Сервис | URL / порт |
|--------|------------|
| AMQP | `localhost:5672` |
| Management UI | [http://localhost:15672](http://localhost:15672) — `course` / `course` |
| Prometheus metrics | `localhost:15692/metrics` |

## Smoke test

```bash
bash scripts/smoke.sh
# Windows: .\scripts\smoke.ps1
```

## CLI в контейнере

```bash
docker exec -it mock-rabbitmq bash
rabbitmqctl list_queues name messages consumers
rabbitmqadmin -u course -p course list queues
rabbitmqadmin -u course -p course publish exchange=amq.default routing_key=lab.test payload="hello"
```

С **хоста** (если установлен `rabbitmqadmin` или любой AMQP-клиент): `amqp://course:course@localhost:5672/`.

## Кластер (intermediate, quorum)

```bash
docker compose -f docker-compose.cluster.yml up -d
bash scripts/init-cluster.sh
```

| Узел | AMQP | UI |
|------|------|-----|
| rabbitmq-1 | 5672 | 15672 |
| rabbitmq-2 | 5673 | 15673 |
| rabbitmq-3 | 5674 | 15674 |

На **одном узле** quorum-очереди тоже можно объявить для лаб (без HA) — достаточно базового `docker-compose.yml`.

## Примеры

- [examples/dlx-policy.json](examples/dlx-policy.json) — аргументы DLX для очереди

## Сброс

```bash
docker compose down -v
```

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| UI не открывается | подождите healthcheck; `docker compose logs rabbitmq` |
| `ACCESS_REFUSED` | логин `course` / `course` |
| Сообщения не доходят | проверьте binding, routing key, vhost `/` |
| Quorum queue error на single node | используйте `x-queue-type=quorum` на RabbitMQ 3.8+ или поднимите cluster compose |

## Связанные курсы

- Сравнение с Kafka/SQS: [kafka-basic/18-vs-queues](../../courses/kafka-basic/18-vs-queues.md)
- AWS очереди: [aws-intermediate/07-sqs-dlq](../../courses/aws-intermediate/07-sqs-dlq.md)
