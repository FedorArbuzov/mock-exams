# Kafka — Intermediate

Continuation of [kafka-basic](../kafka-basic/README.md): **replication and ISR**, **producer/consumer tuning**, **rebalance**, **delivery semantics**, **transactions (EOS)**, **Schema Registry**, **Kafka Connect**, **lag monitoring**, **ACL**, **capacity**, **operations**, an overview of **Strimzi**.

**Prerequisites:** [kafka-basic](../kafka-basic/README.md) — topic, partition, key, acks, consumer group, retention, basic lag.

**Local:** [`deploy/kafka`](../../deploy/kafka/README.md).

## Course stand (3-broker cluster)

The main labs run on a **three-broker KRaft cluster**:

```bash
cd deploy/kafka
docker compose -f docker-compose.cluster.yml up -d
docker compose -f docker-compose.cluster.yml ps
```

| Where you connect from | Bootstrap |
|---------------------|-------------|
| **Host** (kcat, applications) | `localhost:9091,localhost:9092,localhost:9093` |
| **Inside Docker** (CLI in `mock-kafka-1`) | `kafka-1:9092` (or any broker `kafka-2:9092`, `kafka-3:9092`) |
| **Kafka UI** | [http://localhost:8080](http://localhost:8080) — bootstrap inside the network: `kafka-1:9092,kafka-2:9092,kafka-3:9092` |

CLI inside the first broker's container:

```bash
docker exec -it mock-kafka-1 bash
export BS=kafka-1:9092
/opt/kafka/bin/kafka-topics.sh --bootstrap-server $BS --list
```

**Schema Registry + Connect** (chapters 13–16): the overlay [`docker-compose.extras.yml`](../../deploy/kafka/docker-compose.extras.yml) is designed for the **single-broker** [`docker-compose.yml`](../../deploy/kafka/docker-compose.yml). For labs 14 and 16, stop the cluster and bring up:

```bash
docker compose -f docker-compose.cluster.yml down
docker compose -f docker-compose.yml -f docker-compose.extras.yml up -d
# Schema Registry :8081, Connect REST :8083, Kafka :9094
```

The remaining chapters use the **cluster** compose again.

## How to read the chapters

1. **Theory** (01, 03, 05…) — a production scenario, the mechanism, common mistakes.
2. **Lab** (02, 04…) — commands on the running stand, cross-checked against the "what you'll see" block.
3. Create topics with **RF=3** explicitly (`auto.create.topics.enable=false` on the cluster).

**Time:** ~**50–70 minutes** per "theory + lab" pair; the [final project](27-final-project.md) — **3–5 hours**.

## Curriculum (14 topics)

| # | Theory | Lab |
|---|--------|------|
| 01 | [Replication, ISR, min.insync.replicas](01-replication.md) | [02](02-lab-replication.md) |
| 02 | [Producer tuning](03-producer-tuning.md) | [04](04-lab-producer-tuning.md) |
| 03 | [Consumer tuning](05-consumer-tuning.md) | [06](06-lab-slow-consumer.md) |
| 04 | [Rebalance](07-rebalance.md) | [08](08-lab-rebalance.md) |
| 05 | [Delivery semantics](09-delivery-semantics.md) | [10](10-lab-idempotency.md) |
| 06 | [Transactions and EOS](11-transactions-eos.md) | [12](12-lab-read-committed.md) |
| 07 | [Schema Registry](13-schema-registry.md) | [14](14-lab-schema-registry.md) |
| 08 | [Kafka Connect](15-kafka-connect.md) | [16](16-lab-connect.md) |
| 09 | [Monitoring](17-monitoring.md) | [18](18-lab-lag-drill.md) |
| 10 | [Security](19-security-basics.md) | [20](20-lab-acl.md) |
| 11 | [Capacity](21-capacity.md) | [22](22-lab-hot-partition.md) |
| 12 | [Operations](23-operations.md) | [24](24-lab-alter-topic.md) |
| 13 | [Strimzi on Kubernetes](25-strimzi-k8s.md) | — |
| 14 | [Final project](27-final-project.md) | |

## What you should end up with

- Create a topic with **RF=3**, explain **leader / follower / ISR** and the effect of **`min.insync.replicas`**.
- Tune the producer (**acks**, batching, **idempotence**) and the consumer (**fetch**, **max.poll**).
- Diagnose **rebalance**, **lag**, **hot partition**.
- Understand **at-least-once / exactly-once** and the limitations of **read_committed**.
- Register a schema in **Schema Registry**, bring up a **Connect** connector.
- Read metrics and CLI for **capacity** and **alter topic**.
- Know why **Strimzi** is used in Kubernetes (theory).

## Examples

| Path | Purpose |
|------|------------|
| [`examples/connect/file-source.json`](examples/connect/file-source.json) | FileStreamSource → Kafka |
| [`examples/connect/file-sink.json`](examples/connect/file-sink.json) | Kafka → FileStreamSink |

## Related courses

| Course | Relation |
|------|-------|
| [kafka-basic](../kafka-basic/README.md) | basic producer/consumer, lag |
| [kafka-advanced](../kafka-advanced/README.md) | tiered storage, MirrorMaker, production security |
| [kuber-intermediate](../kuber-intermediate/README.md) | Strimzi CR, operators |
