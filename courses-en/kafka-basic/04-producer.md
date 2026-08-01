# 04. Producer: key, partition, acks

## Intro: “the payment went twice”

A service sent `payment.captured` to Kafka, got a timeout, **retried** the send — two identical events in the topic. A consumer without **idempotency** charged money twice. A Kafka producer is configured not only for “where to write”, but also **how long to wait for broker confirmation** (**acks**) and **how** to route by partition (**key**).

## What you'll learn

- Parameters **key**, **partition** (explicit), **headers**.
- Semantics of **acks** (`0`, `1`, `all`).
- **Retries**, **batching**, **compression** (overview).
- Link key → partition → order.

## Writing to the log

The producer sends a **Record**:

| Field | Purpose |
|-------|---------|
| **key** | routing; `null` → round-robin |
| **value** | payload (bytes; often JSON/Avro) |
| **headers** | metadata (trace-id, content-type) |
| **timestamp** | CreateTime or LogAppendTime |
| **partition** | optionally set manually (rare) |

## Key and partition

```text
partition = murmur2(key) % numPartitions   (if key is set)
```

Same key → **one** partition → **order** of events with that key.

**When key isn’t needed:** metrics, logs without affinity — more even load across partitions.

**When key is required:** order, user, account — everything for one aggregate.

## acks — how long to wait for confirmation

| acks | Meaning | Latency | Durability |
|------|---------|---------|------------|
| **0** | fire-and-forget | low | low (can lose) |
| **1** | leader wrote | medium | medium (leader crash before replication — risk) |
| **all** / **-1** | all ISR confirmed | higher | higher (with min.insync.replicas) |

On the training stand with **RF=1** the difference between `1` and `all` is minimal; in a cluster with RF=3 — critical.

Related settings (intermediate):

- `min.insync.replicas` on the broker
- `enable.idempotence=true` on the producer — protection against duplicates on retry

## Batching and linger

The producer does **not** send each record as a separate TCP packet:

- `batch.size` — batch size in bytes
- `linger.ms` — wait N ms to fill the batch

Higher throughput, slightly higher latency.

## Compression

`compression.type`: `none`, `gzip`, `lz4`, `zstd`, `snappy`. Less network and disk, CPU on broker/client.

## On the stand: producer with key in CLI

Create a topic:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.keys --partitions 3 --replication-factor 1 \
  --if-not-exists
```

Send with key (property parser):

```bash
printf 'order-A|event one\norder-A|event two\norder-B|event three\n' | \
  docker exec -i mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.keys \
  --property parse.key=true \
  --property key.separator='|'
```

Check partition:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.keys \
  --from-beginning \
  --property print.key=true \
  --property print.partition=true \
  --timeout-ms 5000
```

`order-A` — one partition; `order-B` — possibly another.

## Common mistakes

| Mistake | Consequence | What to do |
|---------|-------------|------------|
| No key for related events | order broken | key = business id |
| `acks=0` for money | loss on failure | `all` + idempotence |
| Huge messages (> `message.max.bytes`) | RecordTooLargeException | shrink payload, S3 reference |
| Sync send in a loop without batch | low RPS | async + batch |
| Random key on every send | hot partition under skew | salt + hash or different design |

## In production

- Producer metrics: **record-send-rate**, **request-latency**, **errors**.
- **Dead letter topic** for poison messages (consumer pattern).
- Schema versioning via **Schema Registry** — [10. Serialization](10-serialization.md).
- Tracing: `traceparent` header from OpenTelemetry.

## Summary

**Key** sets partition and order. **acks** balances speed and durability. Batching and compression are about efficiency. Duplicates on retry are fixed with an **idempotent producer** and **idempotent** consumers.

## Checklist

- Where does a record without a key go in a topic with 5 partitions?
- How does `acks=all` differ from `acks=1` at RF=3?
- Why one key for all events of an order?
- What is ISR in one sentence?

Next lesson: [05. Lab: producer and kcat](05-lab-producer.md).
