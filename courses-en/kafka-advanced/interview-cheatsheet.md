# Interview cheatsheet — Kafka Advanced

Tables to review before the interview. Format: **question → short answer (≈30 s) → deep dive (2–3 min)**.

Full expanded chapters: [17-interview-qa](17-interview-qa.md). Practice: [18-lab-mock-interview](18-lab-mock-interview.md).

**Sandbox:** [`deploy/kafka`](../../deploy/kafka/README.md) · **Predecessor:** [`kafka-intermediate`](../kafka-intermediate/README.md) · **K8s:** [`kuber-intermediate/01-statefulset`](../kuber-intermediate/01-statefulset.md)

---

## Architecture and storage

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 1 | Kafka vs RabbitMQ? | Kafka = retained commit log; Rabbit = smart broker queues | Pull vs push; replay; routing exchanges vs partitions; use-case streaming vs task queue |
| 2 | Partition and key? | Ordered log per partition; key → stable partition | `hash(key)%N`; hot key; consumer parallelism capped by partitions |
| 3 | Offset? | Cursor in a partition; commit in `__consumer_offsets` | Per-partition; not global; earliest/latest for new group |
| 4 | Leader and ISR? | Leader serves IO; ISR = caught-up replicas | `acks=all` + min ISR; election from ISR; URP when follower lags |
| 5 | Log segment? | `.log` + indexes; roll & retention/compaction | Active segment append-only; fetch uses index; tiered offloads closed ([06](06-tiered-storage.md)) |

---

## Producer / Consumer

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 6 | acks 0/1/all? | Durability vs latency trade-off | `all` + `min.insync.replicas=2` typical prod; `1` risk before replicate |
| 7 | Idempotent producer? | PID dedupe per partition | `enable.idempotence`; needs `acks=all`; not cross-partition txn alone |
| 8 | Rebalance? | Partitions reassigned on membership change | Eager vs cooperative-sticky; static `group.instance.id`; duplicates if commit after process |
| 9 | At-least-once vs EOS? | Retry → duplicates; EOS = Kafka transactions | Idempotent sink; Streams `exactly_once_v2`; external DB needs business key |
| 10 | Consumer lag? | `endOffset - committed` | Scale consumers ≤ partitions; distinguish from replication lag |

---

## KRaft / ZK / Operations

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 11 | KRaft vs ZK? | Metadata inside Kafka quorum | ZK legacy; migration project; Kafka 4 no ZK ([02](02-kraft.md), [04](04-zookeeper-legacy.md)) |
| 12 | Controller role? | Leader election, ISR, metadata | Single active; KRaft metadata log; overload at huge partition count |
| 13 | URP? | Replica not in ISR | Stop broker, disk, network; describe URP; restore broker ([15](15-troubleshooting.md)) |
| 14 | Unclean leader election? | Leader from non-ISR — data loss risk | Keep disabled prod; exec decision DR only |
| 15 | Partition count? | Parallelism + throughput unit | Too many → metadata cost; repartition changes key distribution |

---

## Streams / Ecosystem

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 16 | Streams vs Flink? | Library in app vs distributed engine | Scale, CEP, event time, ops cost ([09](09-ksql-flink.md)) |
| 17 | KTable vs KStream? | Table = latest per key; Stream = events | Changelog; GlobalKTable broadcast; RocksDB state |
| 18 | Schema Registry? | Central schema + compatibility | Avro common; BACKWARD/FULL; decouple deploy cycles |
| 19 | Kafka Connect? | Managed connectors framework | Workers; offset topics; MM2 built on Connect |
| 20 | MirrorMaker 2? | Inter-cluster replication | `source.topic`; offset sync; active-active conflicts ([10](10-multi-dc.md)) |

---

## Security / Cloud

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 21 | Secure prod Kafka? | TLS + SASL/mTLS + ACL default deny | Per-service principal; audit logs ([13](13-security-advanced.md)) |
| 22 | MSK vs self-hosted? | AWS patches brokers; you own topics/clients | VPC, IAM auth, MSK Connect; Strimzi needs SRE ([11](11-managed-kafka.md)) |
| 23 | Tiered storage? | Hot local + cold S3 | Cost vs fetch latency; not backup replacement |

---

## Design / Reliability

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 24 | Global ordering? | Only per partition; one partition doesn't scale | Key design; multi-DC loses global order |
| 25 | DLQ pattern? | Poison → dead-letter topic; fix → replay | Headers metadata; idempotent replay ([21](21-poison-dlq-replay.md)) |
| 26 | Retention vs compact? | Time/size delete vs last key wins | Changelog topics; `compact,delete` combo |
| 27 | Large messages? | Bad for Kafka; use reference store | Align max.message.bytes; compression zstd |
| 28 | Stretch cluster 2 DC? | Anti-pattern | Two clusters + MM2; latency/fsync |
| 29 | Hot partition? | Skewed key/load | Salt keys; more partitions; monitor per-partition lag |
| 30 | Design 50k evt/s bus? | RF3, min ISR, schemas, monitoring, DLQ | Capacity brokers/disk; no RF=1; [19](19-system-design.md) |

---

## Quick commands (sandbox)

| Task | Command |
|--------|---------|
| List topics | `kafka-topics.sh --bootstrap-server localhost:9092 --list` |
| URP | `kafka-topics.sh --describe --under-replicated-partitions` |
| Cluster | `kafka-cluster.sh describe` |
| Consumer groups | `kafka-consumer-groups.sh --describe --group G` |
| KRaft default host | `localhost:9094` ([README](README.md)) |
| ZK profile host | `localhost:9092` ([05-lab-zookeeper](05-lab-zookeeper.md)) |

---

## Related course files

| Topic | Chapter |
|------|-------|
| Internals | [01](01-internals.md) |
| KRaft lab | [03](03-lab-kraft.md) |
| Streams lab | [08](08-lab-streams.md) |
| MSK lab | [12](12-lab-managed-mapping.md) |
| URP lab | [16](16-lab-urp-recovery.md) |
| Capstone | [23](23-capstone.md) |
