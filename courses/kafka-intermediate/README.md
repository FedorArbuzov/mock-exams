# Kafka — Intermediate

Продолжение [kafka-basic](../kafka-basic/README.md): **репликация и ISR**, **tuning producer/consumer**, **rebalance**, **семантики доставки**, **транзакции (EOS)**, **Schema Registry**, **Kafka Connect**, **мониторинг lag**, **ACL**, **ёмкость**, **операции**, обзор **Strimzi**.

**Предварительно:** [kafka-basic](../kafka-basic/README.md) — topic, partition, key, acks, consumer group, retention, базовый lag.

**Локально:** [`deploy/kafka`](../../deploy/kafka/README.md).

## Стенд курса (кластер 3 брокера)

Основные лабы — **трёхброкерный KRaft-кластер**:

```bash
cd deploy/kafka
docker compose -f docker-compose.cluster.yml up -d
docker compose -f docker-compose.cluster.yml ps
```

| Откуда подключаетесь | Bootstrap |
|---------------------|-------------|
| **Хост** (kcat, приложения) | `localhost:9091,localhost:9092,localhost:9093` |
| **Внутри Docker** (CLI в `mock-kafka-1`) | `kafka-1:9092` (или любой брокер `kafka-2:9092`, `kafka-3:9092`) |
| **Kafka UI** | [http://localhost:8080](http://localhost:8080) — bootstrap внутри сети: `kafka-1:9092,kafka-2:9092,kafka-3:9092` |

CLI в контейнере первого брокера:

```bash
docker exec -it mock-kafka-1 bash
export BS=kafka-1:9092
/opt/kafka/bin/kafka-topics.sh --bootstrap-server $BS --list
```

**Schema Registry + Connect** (главы 13–16): overlay [`docker-compose.extras.yml`](../../deploy/kafka/docker-compose.extras.yml) рассчитан на **одноброкерный** [`docker-compose.yml`](../../deploy/kafka/docker-compose.yml). Для лаб 14 и 16 остановите cluster и поднимите:

```bash
docker compose -f docker-compose.cluster.yml down
docker compose -f docker-compose.yml -f docker-compose.extras.yml up -d
# Schema Registry :8081, Connect REST :8083, Kafka :9094
```

Остальные главы снова используют **cluster** compose.

## Как читать главы

1. **Теория** (01, 03, 05…) — сценарий с продакшена, механизм, типичные ошибки.
2. **Лаба** (02, 04…) — команды на поднятом стенде, сверка с блоком «что увидите».
3. Topic с **RF=3** создавайте явно (`auto.create.topics.enable=false` на cluster).

**Время:** ~**50–70 минут** на пару «теория + лаба»; [финальный проект](27-final-project.md) — **3–5 часов**.

## Программа (14 тем)

| # | Теория | Лаба |
|---|--------|------|
| 01 | [Репликация, ISR, min.insync.replicas](01-replication.md) | [02](02-lab-replication.md) |
| 02 | [Producer tuning](03-producer-tuning.md) | [04](04-lab-producer-tuning.md) |
| 03 | [Consumer tuning](05-consumer-tuning.md) | [06](06-lab-slow-consumer.md) |
| 04 | [Rebalance](07-rebalance.md) | [08](08-lab-rebalance.md) |
| 05 | [Семантики доставки](09-delivery-semantics.md) | [10](10-lab-idempotency.md) |
| 06 | [Транзакции и EOS](11-transactions-eos.md) | [12](12-lab-read-committed.md) |
| 07 | [Schema Registry](13-schema-registry.md) | [14](14-lab-schema-registry.md) |
| 08 | [Kafka Connect](15-kafka-connect.md) | [16](16-lab-connect.md) |
| 09 | [Мониторинг](17-monitoring.md) | [18](18-lab-lag-drill.md) |
| 10 | [Безопасность](19-security-basics.md) | [20](20-lab-acl.md) |
| 11 | [Ёмкость](21-capacity.md) | [22](22-lab-hot-partition.md) |
| 12 | [Операции](23-operations.md) | [24](24-lab-alter-topic.md) |
| 13 | [Strimzi на Kubernetes](25-strimzi-k8s.md) | — |
| 14 | [Финальный проект](27-final-project.md) | |

## Что должно получиться

- Создаёте topic с **RF=3**, объясняете **leader / follower / ISR** и влияние **`min.insync.replicas`**.
- Настраиваете producer (**acks**, batching, **idempotence**) и consumer (**fetch**, **max.poll**).
- Диагностируете **rebalance**, **lag**, **hot partition**.
- Понимаете **at-least-once / exactly-once** и ограничения **read_committed**.
- Регистрируете схему в **Schema Registry**, поднимаете **Connect** connector.
- Читаете метрики и CLI для **capacity** и **alter topic**.
- Знаете, зачем **Strimzi** в Kubernetes (теория).

## Примеры

| Путь | Назначение |
|------|------------|
| [`examples/connect/file-source.json`](examples/connect/file-source.json) | FileStreamSource → Kafka |
| [`examples/connect/file-sink.json`](examples/connect/file-sink.json) | Kafka → FileStreamSink |

## Связь

| Курс | Связь |
|------|-------|
| [kafka-basic](../kafka-basic/README.md) | базовые producer/consumer, lag |
| [kafka-advanced](../kafka-advanced/README.md) | tiered storage, MirrorMaker, прод security |
| [kuber-intermediate](../kuber-intermediate/README.md) | Strimzi CR, операторы |
