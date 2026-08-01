# 22. Lab: hot partition

## Lab goal

Create a load **skew**: 95% of messages with a single key, observe the unevenness of **size/offset** across partitions in describe and the consumer lag.

## Prerequisites

- [21. Capacity](21-capacity.md).

---

## Task 1. Topic

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.hot.partition \
  --partitions 6 --replication-factor 3
```

---

## Task 2. Skewed produce

```bash
for i in $(seq 1 1000); do
  key="HOT-KEY"
  [ $((i % 20)) -eq 0 ] && key="cold-$((i % 6))"
  printf '%s|payload-%s\n' "$key" "$i"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.hot.partition \
  --property parse.key=true --property key.separator='|'
```

---

## Task 3. Distribution across partitions

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.hot.partition \
  --from-beginning --timeout-ms 3000 \
  --property print.partition=true --property print.key=true \
  | sort | uniq -c | sort -rn | head -20
```

**What you'll see:** one partition contains **most** of the lines with the key `HOT-KEY`.

---

## Task 4. Log end offset per partition

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-get-offsets.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.hot.partition
```

**What you'll see:** one partition has a **LOG-END** much higher than the others.

---

## Task 5. Consumer lag with an equal number of consumers

Run **one** consumer in the group `lab-hot-g1`, read to the end. Run **six** consumers in the same group on a **new** topic with even keys (create `lab.hot.even`, 1000 messages with keys `k0`…`k5` evenly) — compare the catch-up time.

Brief conclusion: why **6 consumers** don't help **one** hot partition.

---

## Task 6. Remediation plan (in writing)

Propose **two** options without changing the broker: (1) changing the key model; (2) moving the burst into a separate topic.

---

## Success criteria

- [ ] The skew is visible in **print.partition** and get-offsets.
- [ ] You explained why scaling consumers doesn't fix a hot key.
- [ ] Two mitigation options in the report.

**Next:** [23. Operations](23-operations.md).
