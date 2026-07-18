# Kafka — Advanced

Продвинутый уровень для **собеседований** и **production**: **внутренности брокера**, **KRaft**, legacy **ZooKeeper**, **tiered storage**, **Kafka Streams**, сравнение **ksqlDB / Flink**, **multi-DC (MirrorMaker 2)**, **managed Kafka (MSK / Confluent)**, **security (ACL, mTLS)**, **troubleshooting (URP, recovery)**, **system design**, **poison message / DLQ**, **mock interview** и **capstone**.

**Предварительно:** [`kafka-basic`](../kafka-basic/README.md) — topic, partition, consumer group, lag. [`kafka-intermediate`](../kafka-intermediate/README.md) — RF, ISR, `min.insync.replicas`, Schema Registry, Connect (ожидается в треке; если ещё не проходили — повторите basic + [`deploy/kafka`](../../deploy/kafka/README.md) cluster overlay).

**Локально:** [`deploy/kafka`](../../deploy/kafka/README.md)

| Профиль | Команда | Bootstrap с хоста |
|---------|---------|-------------------|
| KRaft (default) | `docker compose up -d` | `localhost:9094` |
| 3 брокера | `docker compose -f docker-compose.cluster.yml up -d` | `localhost:9091,9092,9093` |
| ZK legacy | `docker compose -f docker-compose.zk.yml up -d` | `localhost:9092` |
| Registry + Connect | `docker compose -f docker-compose.yml -f docker-compose.extras.yml up -d` | + `8081`, `8083` |

**Kubernetes:** StatefulSet и Headless Service для stateful workloads — [`kuber-intermediate: 01-statefulset`](../kuber-intermediate/01-statefulset.md). Kafka в k8s обычно через **Strimzi / Confluent Operator / MSK** — в этом курсе фокус на **концепциях**, не на полном Helm-чарте.

## Как читать главы

Каждый урок — **глава книги** под подготовку к интервью, не сухая шпаргалка.

1. **Теория** (01, 02, 04, 06…) — сценарий с работы → концепции → пример на стенде → типичные ошибки → «на собеседовании» → резюме.
2. **Лаба** (03, 05, 08…) — цель → предварительно → задания → «что увидите» → критерии успеха.
3. После блоков 15–18 — пройдите [`interview-cheatsheet.md`](interview-cheatsheet.md) без подглядывания в ответы.

**Время:** ~60–90 минут на пару «теория + лаба»; [capstone](23-capstone.md) — **4–6 часов**.

## Программа

### Внутренности и метаданные (01–05)

| # | Урок |
|---|------|
| 01 | [Внутренности брокера](01-internals.md) |
| 02 | [KRaft: controller, quorum](02-kraft.md) |
| 03 | [Лаба: KRaft metadata](03-lab-kraft.md) |
| 04 | [ZooKeeper mode (legacy)](04-zookeeper-legacy.md) |
| 05 | [Лаба: ZK compose](05-lab-zookeeper.md) |

### Хранение и stream processing (06–09)

| 06 | [Tiered storage](06-tiered-storage.md) |
| 07 | [Kafka Streams](07-kafka-streams.md) |
| 08 | [Лаба: Streams / kcat-симуляция](08-lab-streams.md) |
| 09 | [ksqlDB vs Flink](09-ksql-flink.md) |

### География и облако (10–12)

| 10 | [Multi-DC, MirrorMaker 2](10-multi-dc.md) |
| 11 | [Managed Kafka: MSK, Confluent](11-managed-kafka.md) |
| 12 | [Лаба: сравнительная таблица](12-lab-managed-mapping.md) |

### Security (13–14)

| 13 | [Security advanced](13-security-advanced.md) |
| 14 | [Лаба: ACL deny](14-lab-acl-deny.md) |

### Ops и интервью (15–20)

| 15 | [Troubleshooting](15-troubleshooting.md) |
| 16 | [Лаба: URP recovery](16-lab-urp-recovery.md) |
| 17 | [Interview Q&A (топ-30)](17-interview-qa.md) |
| 18 | [Лаба: mock interview](18-lab-mock-interview.md) |
| 19 | [System design](19-system-design.md) |
| 20 | [Лаба: system design](20-lab-system-design.md) |

### Надёжность приложений (21–23)

| 21 | [Poison message, DLQ, replay](21-poison-dlq-replay.md) |
| 22 | [Лаба: DLQ](22-lab-dlq.md) |
| 23 | [Capstone](23-capstone.md) |

### Шпаргалка

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Объясняете **log segment**, **ISR**, **controller**, разницу **KRaft vs ZK**.
- Сравниваете **Kafka Streams**, **ksqlDB**, **Flink** по границам ответственности.
- Проектируете **active-active / active-passive** с MM2 и ограничениями ordering.
- Читаете **MSK vs Confluent Cloud** по SLA, security, ops burden.
- Настраиваете **ACL**, понимаете **deny-by-default** и super user.
- Восстанавливаете **under-replicated partition** на учебном кластере.
- Отвечаете на **system design** «event backbone для 10k RPS» с trade-offs.
- Проектируете **DLQ + replay** без двойных побочных эффектов.

## Связь с другими курсами

| Курс | Связь |
|------|-------|
| [`kafka-basic`](../kafka-basic/README.md) | offset, group, retention |
| [`kafka-intermediate`](../kafka-intermediate/README.md) | RF, ISR, Connect, Registry |
| [`kuber-intermediate`](../kuber-intermediate/01-statefulset.md) | StatefulSet для брокеров |
| [`gitlab-intermediate`](../gitlab-intermediate/README.md) | CI для Terraform MSK / GitOps |
| [`aws-intermediate`](../aws-intermediate/README.md) | MSK в VPC, IAM |
