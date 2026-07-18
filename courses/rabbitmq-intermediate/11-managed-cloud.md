# 11. Managed messaging: Amazon MQ for RabbitMQ

## Введение: «мы подняли Rabbit в EC2, а патчить некому»

Self-hosted RabbitMQ на VM или в Kubernetes даёт полный контроль — и полную ответственность: Erlang cookie, clustering, quorum, backups, TLS, upgrades. **Amazon MQ** — managed-сервис AWS с движком **RabbitMQ** (или ActiveMQ). Команда получает endpoint AMQP, Multi-AZ deployment и интеграцию с **VPC**, **Secrets Manager**, **CloudWatch** — без SSH на брокер.

Эта глава **теоретическая**: в курсе mock-exams нет обязательного AWS-аккаунта. Связь с практикой AWS — [aws-basic](../aws-basic/README.md), очереди SQS — [aws-intermediate](../aws-intermediate/README.md).

## Что вы узнаете

- Модели **Amazon MQ** (RabbitMQ vs ActiveMQ).
- **Single-instance** vs **cluster** (Multi-AZ).
- Сеть: **private broker**, security groups, без публичного AMQP.
- Отличия от self-hosted и от **SQS**.
- Когда MQ, когда SQS/Kafka.

---

## Amazon MQ for RabbitMQ

| Параметр | Типичный выбор |
|----------|----------------|
| Engine | RabbitMQ 3.x (версия фиксируется AWS) |
| Deployment | **CLUSTER_MULTI_AZ** для прод |
| Host class | `mq.m5.large` и выше по нагрузке |
| Access | пользователи в консоли MQ / LDAP (Enterprise) |

Подключение приложений — тот же **AMQP 5671** (TLS) / **5672** в private subnet. **Management plugin** доступен на отдельном порту (ограничьте SG только bastion / VPN).

**Quorum queues** поддерживаются на совместимых версиях RabbitMQ в Amazon MQ — проверяйте [документацию AWS](https://docs.aws.amazon.com/amazon-mq/) на момент внедрения.

## Сеть и безопасность

```text
[App in private subnet] --AMQP TLS--> [Amazon MQ broker ENI]
                                        |
                                   CloudWatch logs
```

- Broker в **private subnets** без public accessibility.
- **Security group**: ingress 5671 только от SG приложений.
- Пароли в **Secrets Manager**, ротация.
- **IAM** не заменяет RabbitMQ users для AMQP — нужны отдельные credentials (в отличие от IAM-auth в некоторых других сервисах).

## Amazon MQ vs SQS

| | Amazon MQ (Rabbit) | SQS |
|---|-------------------|-----|
| Протокол | AMQP 0-9-1 | AWS API |
| Routing | exchanges, bindings | очередь + DLQ |
| Ordering | FIFO в одной очереди (ограниченно) | FIFO queues отдельно |
| Ops | patching AWS, sizing | serverless |
| Курс | эта глава | [07-sqs-dlq](../aws-intermediate/07-sqs-dlq.md) |

**SQS** проще для Lambda + serverless ([aws-intermediate](../aws-intermediate/README.md)). **RabbitMQ** — когда нужны **сложные топологии** (topic, headers, DLX chains, TTL), существующие AMQP-клиенты, federation.

## Amazon MQ vs self-hosted (deploy/rabbitmq)

| | `deploy/rabbitmq` | Amazon MQ |
|---|-------------------|-----------|
| Стоимость | Docker локально | $$$ instance hours |
| Кластер | `docker-compose.cluster.yml` | Multi-AZ managed |
| Prometheus | `:15692` на стенде | CloudWatch + опционально Prometheus plugin |
| Обучение | полный доступ ctl | ограниченный admin |

Паттерны курса (**DLX**, **quorum**, **confirms**) переносятся 1:1; меняется только endpoint и политика бэкапов.

## Amazon MQ vs Kafka (MSK)

| Сценарий | Склонность |
|----------|------------|
| Task queue, work distribution, RPC reply | RabbitMQ |
| Event log, replay, stream processing | [Kafka](../kafka-intermediate/README.md) |
| AWS-native, Lambda triggers | SQS |

## Миграция и гибрид

- **Dual write** при миграции с on-prem — риск дублей; лучше **strangler**: новые сервисы на MQ, старые drain.
- **Shovel / federation** — межброкерная репликация (advanced, не на стенде).
- Мониторинг DLQ — CloudWatch custom metric или scrape Prometheus sidecar (если включён).

## Чек-лист

- Чем Amazon MQ отличается от SQS?
- Зачем Multi-AZ cluster?
- Переносятся ли DLX и quorum из локального курса?
- Когда выбрать MSK вместо MQ?

Следующий шаг: [12-final-project.md](12-final-project.md).
