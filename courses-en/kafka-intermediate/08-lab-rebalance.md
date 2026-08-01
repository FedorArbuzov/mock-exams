# 08. Lab: rebalance in a consumer group

## Lab goal

Observe the **redistribution of partitions** when adding and removing a consumer in the same group on the cluster; record the **generation** and partition assignment in the CLI/UI.

## Prerequisites

- [07. Rebalance](07-rebalance.md).

---

## Task 1. Prepare the topic

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.rebalance \
  --partitions 6 --replication-factor 3

for i in $(seq 1 100); do printf 'k%d|m%d\n' $((i%6)) $i; done | \
  docker exec -i mock-kafka-1 /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 --topic lab.rebalance \
  --property parse.key=true --property key.separator='|'
```

---

## Task 2. One consumer

Terminal A:

```bash
docker exec -it mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.rebalance \
  --group lab-rebalance-g1 \
  --consumer-property partition.assignment.strategy=org.apache.kafka.clients.consumer.StickyAssignor
```

In another window:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --group lab-rebalance-g1 --members --verbose
```

**What you'll see:** one **consumer-id**, assigned **all 6** partitions (CONSUMER-ID, HOST, PARTITION).

---

## Task 3. A second consumer — rebalance

Terminal B (the same group):

```bash
docker exec -it mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.rebalance \
  --group lab-rebalance-g1
```

Again `--describe --members --verbose`.

**What you'll see:** **two** consumers; the partitions have been **split** (~3 and ~3); **GENERATION** increased.

---

## Task 4. Stop consumer B

Ctrl+C in terminal B, wait 5–10 s, describe again.

**What you'll see:** all partitions are back on consumer A; another **rebalance**.

---

## Task 5. Kafka UI

Open [http://localhost:8080](http://localhost:8080) → Consumer Groups → `lab-rebalance-g1`.

**What you'll see:** members, lag, assigned partitions — cross-check with the CLI.

---

## Task 6. Report (3 points)

1. How many partitions did each member have with two consumers?
2. What happened to the **committed offset** when B left (read describe — the offset doesn't roll back)?
3. Why are duplicates possible during a rebalance without an **idempotent** handler?

---

## Success criteria

- [ ] You saw **generation** ↑ on join/leave.
- [ ] The partitions were redistributed between 1 and 2 consumers.
- [ ] You answered the three report points.

**Next:** [09. Delivery semantics](09-delivery-semantics.md).
