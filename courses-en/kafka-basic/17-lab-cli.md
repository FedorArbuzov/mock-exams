# 17. Lab: describe topic and get offsets

## Lab goal

Practice an **operator** scenario: create a topic, send data, capture **log end offsets**, create a consumer group, read partially, compare **committed** and **end** via `kafka-consumer-groups.sh`.

## Prerequisites

- [16. CLI](16-cli.md).
- Kafka stand running.

---

## Task 1. Topic lab.cli-audit

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.cli-audit \
  --partitions 3 --replication-factor 1 --if-not-exists

docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --describe --topic lab.cli-audit
```

**Write down:** `PartitionCount`, `Leader` for partition 0.

---

## Task 2. Produce 30 messages

```bash
for i in $(seq 1 30); do
  echo "audit-$i" | docker exec -i mock-kafka \
    /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 --topic lab.cli-audit
done
```

---

## Task 3. Log end offsets

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-get-offsets.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.cli-audit
```

**What you’ll see:** three lines `lab.cli-audit:0:…`, `:1:…`, `:2:…` — sum of end offsets ≈ 30 (round-robin distribution).

---

## Task 4. Consumer group audit-readers

Read 12 messages:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.cli-audit \
  --group audit-readers \
  --max-messages 12 \
  --timeout-ms 20000
```

---

## Task 5. Describe group

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group audit-readers --describe
```

**What you’ll see:** per partition `CURRENT-OFFSET`, `LOG-END-OFFSET`, `LAG`.

Compute by hand: sum of **LAG** across partitions ≈ 30 − 12 = **18** (may differ by 1–2 due to distribution).

---

## Task 6. Dry-run reset (no execute)

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group audit-readers \
  --reset-offsets --to-earliest \
  --topic lab.cli-audit
```

**What you’ll see:** offset plan **without** applying (no `--execute`).

Do **not** add `--execute` on a shared stand unless needed.

---

## Task 7. List and cleanup

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list | grep lab.cli

docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --list | grep audit
```

Optionally delete the topic:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --delete --topic lab.cli-audit
```

---

## Success criteria

- [ ] `--describe --topic lab.cli-audit` showed 3 partitions
- [ ] `kafka-get-offsets.sh` returned end offsets
- [ ] Group `audit-readers` with total LAG > 0 after 12 messages
- [ ] Dry-run reset showed a plan without `--execute`

## Takeaways for work

- Three on-call commands: **describe topic**, **describe group**, **get-offsets**.

Next lesson: [18. Kafka vs queues](18-vs-queues.md).
