# Kafka — Advanced

Advanced level for **interviews** and **production**: **broker internals**, **KRaft**, legacy **ZooKeeper**, **tiered storage**, **Kafka Streams**, comparison of **ksqlDB / Flink**, **multi-DC (MirrorMaker 2)**, **managed Kafka (MSK / Confluent)**, **security (ACL, mTLS)**, **troubleshooting (URP, recovery)**, **system design**, **poison message / DLQ**, **mock interview**, and **capstone**.

**Prerequisites:** [`kafka-basic`](../kafka-basic/README.md) — topic, partition, consumer group, lag. [`kafka-intermediate`](../kafka-intermediate/README.md) — RF, ISR, `min.insync.replicas`, Schema Registry, Connect (expected on the track; if you haven't taken it yet — review basic + [`deploy/kafka`](../../deploy/kafka/README.md) cluster overlay).

**Locally:** [`deploy/kafka`](../../deploy/kafka/README.md)

| Profile | Command | Bootstrap from host |
|---------|---------|-------------------|
| KRaft (default) | `docker compose up -d` | `localhost:9094` |
| 3 brokers | `docker compose -f docker-compose.cluster.yml up -d` | `localhost:9091,9092,9093` |
| ZK legacy | `docker compose -f docker-compose.zk.yml up -d` | `localhost:9092` |
| Registry + Connect | `docker compose -f docker-compose.yml -f docker-compose.extras.yml up -d` | + `8081`, `8083` |

**Kubernetes:** StatefulSet and Headless Service for stateful workloads — [`kuber-intermediate: 01-statefulset`](../kuber-intermediate/01-statefulset.md). Kafka on k8s is usually run via **Strimzi / Confluent Operator / MSK** — this course focuses on **concepts**, not on a full Helm chart.

## How to read the chapters

Each lesson is a **book chapter** for interview prep, not a dry cheatsheet.

1. **Theory** (01, 02, 04, 06…) — a scenario from work → concepts → example on the sandbox → common mistakes → "in the interview" → summary.
2. **Lab** (03, 05, 08…) — goal → prerequisites → tasks → "what you'll see" → success criteria.
3. After blocks 15–18 — go through [`interview-cheatsheet.md`](interview-cheatsheet.md) without peeking at the answers.

**Time:** ~60–90 minutes per "theory + lab" pair; [capstone](23-capstone.md) — **4–6 hours**.

## Curriculum

### Internals and metadata (01–05)

| # | Lesson |
|---|------|
| 01 | [Broker internals](01-internals.md) |
| 02 | [KRaft: controller, quorum](02-kraft.md) |
| 03 | [Lab: KRaft metadata](03-lab-kraft.md) |
| 04 | [ZooKeeper mode (legacy)](04-zookeeper-legacy.md) |
| 05 | [Lab: ZK compose](05-lab-zookeeper.md) |

### Storage and stream processing (06–09)

| 06 | [Tiered storage](06-tiered-storage.md) |
| 07 | [Kafka Streams](07-kafka-streams.md) |
| 08 | [Lab: Streams / kcat simulation](08-lab-streams.md) |
| 09 | [ksqlDB vs Flink](09-ksql-flink.md) |

### Geography and cloud (10–12)

| 10 | [Multi-DC, MirrorMaker 2](10-multi-dc.md) |
| 11 | [Managed Kafka: MSK, Confluent](11-managed-kafka.md) |
| 12 | [Lab: comparison table](12-lab-managed-mapping.md) |

### Security (13–14)

| 13 | [Security advanced](13-security-advanced.md) |
| 14 | [Lab: ACL deny](14-lab-acl-deny.md) |

### Ops and interview (15–20)

| 15 | [Troubleshooting](15-troubleshooting.md) |
| 16 | [Lab: URP recovery](16-lab-urp-recovery.md) |
| 17 | [Interview Q&A (top 30)](17-interview-qa.md) |
| 18 | [Lab: mock interview](18-lab-mock-interview.md) |
| 19 | [System design](19-system-design.md) |
| 20 | [Lab: system design](20-lab-system-design.md) |

### Application reliability (21–23)

| 21 | [Poison message, DLQ, replay](21-poison-dlq-replay.md) |
| 22 | [Lab: DLQ](22-lab-dlq.md) |
| 23 | [Capstone](23-capstone.md) |

### Cheatsheet

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you should end up with

- Explain **log segment**, **ISR**, **controller**, the difference between **KRaft vs ZK**.
- Compare **Kafka Streams**, **ksqlDB**, **Flink** by their scope of responsibility.
- Design **active-active / active-passive** with MM2 and ordering constraints.
- Read **MSK vs Confluent Cloud** by SLA, security, ops burden.
- Configure **ACL**, understand **deny-by-default** and super user.
- Recover an **under-replicated partition** on a training cluster.
- Answer a **system design** "event backbone for 10k RPS" with trade-offs.
- Design **DLQ + replay** without duplicate side effects.

## Related courses

| Course | Relation |
|------|-------|
| [`kafka-basic`](../kafka-basic/README.md) | offset, group, retention |
| [`kafka-intermediate`](../kafka-intermediate/README.md) | RF, ISR, Connect, Registry |
| [`kuber-intermediate`](../kuber-intermediate/01-statefulset.md) | StatefulSet for brokers |
| [`gitlab-intermediate`](../gitlab-intermediate/README.md) | CI for Terraform MSK / GitOps |
| [`aws-intermediate`](../aws-intermediate/README.md) | MSK in VPC, IAM |
