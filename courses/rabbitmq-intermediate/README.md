# RabbitMQ — Intermediate

Продолжение базового курса RabbitMQ (планируется [rabbitmq-basic](../rabbitmq-basic/README.md)): **quorum-очереди**, **Dead Letter Exchange (DLX)**, **TTL и приоритеты**, **publisher confirms**, **мониторинг** (Management API, Prometheus `:15692`), обзор **Amazon MQ**, **финальный проект** — надёжный конвейер заказов с DLX.

**Предварительно:** понимание exchange/queue/binding, `basic.publish` / `basic.consume`, ack/nack, vhost и Management UI.

**Локально:** [`deploy/rabbitmq`](../../deploy/rabbitmq/README.md).

## Стенд курса

| Режим | Compose | Когда |
|-------|---------|--------|
| Один узел (DLX, TTL, confirms, monitoring) | `docker compose up -d` | главы 03–10, финал на single допустим |
| Кластер 3 узла (quorum HA) | `docker compose -f docker-compose.cluster.yml up -d` + [`init-cluster.sh`](../../deploy/rabbitmq/scripts/init-cluster.sh) | главы 01–02, опционально для quorum в продакшене |

```bash
cd deploy/rabbitmq
docker compose up -d
docker compose ps
```

| Сервис | URL / порт |
|--------|------------|
| AMQP | `amqp://course:course@localhost:5672/` |
| Management UI | [http://localhost:15672](http://localhost:15672) — `course` / `course` |
| Prometheus metrics | [http://localhost:15692/metrics](http://localhost:15692/metrics) |

**Кластер (опционально):**

```bash
docker compose -f docker-compose.cluster.yml up -d
bash scripts/init-cluster.sh
```

| Узел | AMQP | UI |
|------|------|-----|
| rabbitmq-1 | 5672 | 15672 |
| rabbitmq-2 | 5673 | 15673 |
| rabbitmq-3 | 5674 | 15674 |

На **одном узле** quorum-очереди объявляются для учебных лаб (без отказоустойчивости реплик) — достаточно базового compose.

Перед сменой стенда: `docker compose down` (и cluster compose), иначе конфликт портов.

## Как читать главы

1. **Теория** (01, 03, 05…) — сценарий с работы, механизм, типичные ошибки.
2. **Лаба** (02, 04…) — команды на поднятом стенде, сверка с «что увидите».
3. Сверяйте JSON-аргументы очередей с примерами в [`deploy/rabbitmq/examples`](../../deploy/rabbitmq/examples/) и в [`examples/`](examples/) курса.

**Время:** ~**50–65 минут** на пару «теория + лаба»; [финальный проект](12-final-project.md) — **3–4 часа**.

## Программа (6 тем + финал)

| # | Теория | Лаба |
|---|--------|------|
| 1 | [Quorum-очереди](01-quorum-queues.md) | [02](02-lab-quorum.md) |
| 2 | [Dead Letter Exchange](03-dead-letter-exchange.md) | [04](04-lab-dlx.md) |
| 3 | [TTL и приоритет](05-ttl-priority.md) | [06](06-lab-ttl-dlx-chain.md) |
| 4 | [Publisher confirms](07-publisher-confirms.md) | [08](08-lab-confirms.md) |
| 5 | [Мониторинг](09-monitoring.md) | [10](10-lab-management-drill.md) |
| 6 | [Managed: Amazon MQ](11-managed-cloud.md) | — |
| 7 | [Финальный проект](12-final-project.md) | |

## Что должно получиться

- Объявляете **`x-queue-type=quorum`**, понимаете отличие от classic mirrored и когда нужен **кластер**.
- Строите **DLX → DLQ**, связываете с [`dlx-policy.json`](../../deploy/rabbitmq/examples/dlx-policy.json).
- Настраиваете **TTL** (message / queue) и **priority**, комбинируете с DLX.
- Включаете **publisher confirms** и обрабатываете `basic.nack` / timeout.
- Читаете **Management API**, **rabbitmqctl**, метрики **Prometheus** на `:15692`.
- Сравниваете с **[SQS DLQ](../aws-intermediate/07-sqs-dlq.md)** и **[Kafka delivery semantics](../kafka-intermediate/09-delivery-semantics.md)**.
- Проектируете **конвейер заказов** с DLX в финале.

## Примеры курса

| Путь | Назначение |
|------|------------|
| [`examples/quorum-queue-declare.json`](examples/quorum-queue-declare.json) | объявление quorum-очереди (Management API) |
| [`examples/dlx-setup.sh`](examples/dlx-setup.sh) | exchange/queue/binding для DLX-лабы |
| [`deploy/rabbitmq/examples/dlx-policy.json`](../../deploy/rabbitmq/examples/dlx-policy.json) | аргументы DLX для рабочей очереди |

## Связь с другими курсами

| Курс | Связь |
|------|-------|
| [kafka-intermediate](../kafka-intermediate/README.md) | репликация, at-least-once, lag vs depth очереди |
| [kafka-intermediate/09-delivery-semantics.md](../kafka-intermediate/09-delivery-semantics.md) | confirms ≈ acks, идемпотентность consumer |
| [aws-intermediate/07-sqs-dlq.md](../aws-intermediate/07-sqs-dlq.md) | DLQ через `maxReceiveCount` vs DLX в RabbitMQ |
| [aws-intermediate/08-lab-sqs-dlq.md](../aws-intermediate/08-lab-sqs-dlq.md) | лаба poison message в SQS |
| [aws-basic/09-messaging.md](../aws-basic/09-messaging.md) | SNS/SQS обзор |
| [observability-intermediate](../observability-intermediate/README.md) | Prometheus + Grafana для алертов на DLQ depth |

## Smoke test стенда

```bash
cd deploy/rabbitmq
bash scripts/smoke.sh
# Windows: .\scripts\smoke.ps1
```
