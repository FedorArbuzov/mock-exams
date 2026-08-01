# 03. Lab: first topic, produce and consume

## Lab goal

Bring up the Kafka stand, **create a topic**, send and **read** messages via CLI inside `mock-kafka`. Note the difference between bootstrap **from the host** (`9094`) and **inside the container** (`9092`).

## Prerequisites

- Docker is running, ports **9094** and **8080** are free.
- From the repo root:

```bash
cd deploy/kafka
docker compose up -d
docker compose ps
```

Container `mock-kafka` status **healthy** (wait 30–60 s). Details: [`deploy/kafka/README.md`](../../deploy/kafka/README.md).

Optional smoke test:

```bash
bash scripts/smoke.sh
```

---

## Task 1. Check the broker

**Why:** confirm the CLI reached the cluster.

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list
```

**What you’ll see:** an empty list or internal topics (`__consumer_offsets` after the first consume).

**If Connection refused:** `docker compose logs kafka`, wait for healthcheck.

---

## Task 2. Create a topic

**Why:** explicitly set partition count (parallelism later).

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.hello \
  --partitions 3 --replication-factor 1

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe --topic lab.hello
```

**What you’ll see:** `PartitionCount: 3`, each partition `Leader: 1`.

**If topic already exists:** add `--if-not-exists` to `--create` or delete the topic (task 6).

---

## Task 3. Console producer

**Why:** manual send without code.

In the **first** terminal:

```bash
docker exec -it mock-kafka /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.hello
```

Enter three lines (Enter after each):

```text
first message
second message
third message
```

Finish: **Ctrl+D** (Linux/macOS) or **Ctrl+Z** Enter (Windows in some terminals).

**What you’ll see:** `>` with no errors — records went into the topic (distributed across partitions).

---

## Task 4. Console consumer from the beginning

**Why:** see all records and their order **within a partition** (across partitions order may differ).

In the **second** terminal:

```bash
docker exec -it mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.hello \
  --from-beginning \
  --property print.timestamp=true \
  --property print.partition=true \
  --property print.offset=true
```

**What you’ll see:** three lines with metadata `partition=… offset=…`.

Stop: **Ctrl+C**.

---

## Task 5. Only new messages

**Why:** the “subscribe and wait for new” model (`auto.offset.reset=latest` on clients).

1. Start a consumer **without** `--from-beginning`:

```bash
docker exec -it mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.hello
```

2. In the producer send `fourth message`.

**What you’ll see:** the consumer shows only `fourth message`, not the old three.

---

## Task 6. Kafka UI (optional)

Open [http://localhost:8080](http://localhost:8080) — topic `lab.hello`, messages, partitions.

---

## Task 7. Cleanup (optional)

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --delete --topic lab.hello
```

---

## Success criteria

- [ ] `mock-kafka` healthy, `--list` with no error
- [ ] Topic `lab.hello` created with 3 partitions
- [ ] Producer sent ≥3 messages
- [ ] Consumer with `--from-beginning` showed all messages with partition/offset
- [ ] Consumer without `--from-beginning` got only the new message

## Takeaways for work

- In course labs bootstrap **inside the container**: `localhost:9092`.
- From the host (kcat, apps): `localhost:9094`.
- `--from-beginning` vs “only new” — a common source of “messages disappeared”.

Next lesson: [04. Producer](04-producer.md).
