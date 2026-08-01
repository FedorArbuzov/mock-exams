# 24. Lab: alter topic and partitions

## Lab goal

Create a topic, change **retention** and **min.insync.replicas**, increase the **partition count**, check **describe** and produce/consume after the alter.

## Prerequisites

- [23. Operations](23-operations.md).

---

## Task 1. Create a topic

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.alter.demo \
  --partitions 3 --replication-factor 3
```

---

## Task 2. Alter retention

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server kafka-1:9092 \
  --entity-type topics --entity-name lab.alter.demo \
  --alter --add-config retention.ms=3600000

docker exec mock-kafka-1 /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server kafka-1:9092 \
  --entity-type topics --entity-name lab.alter.demo \
  --describe
```

**What you'll see:** `retention.ms=3600000` (1 hour).

---

## Task 3. Topic-level min.insync.replicas

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server kafka-1:9092 \
  --entity-type topics --entity-name lab.alter.demo \
  --alter --add-config min.insync.replicas=2
```

---

## Task 4. Increase partitions 3 → 6

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --alter --topic lab.alter.demo --partitions 6

docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.alter.demo
```

**What you'll see:** partitions 0–5; RF=3 on each.

---

## Task 5. Produce after the alter

```bash
for i in $(seq 1 30); do
  printf 'k%d|after-alter-%s\n' "$((i % 6))" "$i"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.alter.demo \
  --producer-property acks=all \
  --property parse.key=true --property key.separator='|'
```

Consumer with a new group — the messages are distributed across **6** partitions.

---

## Task 6. (Optional) Roll a single broker

```bash
docker stop mock-kafka-3
sleep 15
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 --describe --topic lab.alter.demo | head -8
docker start mock-kafka-3
```

**What you'll see:** a brief leader shift; after start the ISR recovers.

---

## Success criteria

- [ ] retention and min.insync.replicas in **describe configs**.
- [ ] **6** partitions after the alter.
- [ ] Produce/consume works after the changes.
- [ ] Briefly: why old messages did **not** move into the new partitions.

**Next:** [25. Strimzi](25-strimzi-k8s.md).
