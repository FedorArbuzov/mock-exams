# 18. Lab: drill — lag growth and recovery

## Lab goal

Model a **lag incident**: load a burst, "stop" processing (don't commit / stop the consumer), record the metrics in the CLI/UI, **scale** the consumer, and bring lag back to zero.

## Prerequisites

- [17. Monitoring](17-monitoring.md).
- The cluster: `docker-compose.cluster.yml`.

---

## Task 1. Topic and baseline

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.lag.drill \
  --partitions 6 --replication-factor 3

docker exec mock-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --group lab-lag-drill-g1 2>/dev/null || true
```

---

## Task 2. Burst produce

```bash
for i in $(seq 1 5000); do
  printf 'user-%03d|evt-%s\n' "$((i % 20))" "$i"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.lag.drill \
  --producer-property acks=all \
  --producer-property compression.type=lz4 \
  --property parse.key=true --property key.separator='|'
```

---

## Task 3. Slow consumer (create lag)

Run a consumer with `max.poll.records=5`, interrupt it after ~5 s:

```bash
docker exec -it mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.lag.drill \
  --group lab-lag-drill-g1 \
  --consumer-property max.poll.records=5
```

---

## Task 4. Record lag (T0)

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --group lab-lag-drill-g1
```

Write down the **total LAG** (sum the LAG column) and the partition with the **maximum** lag.

**Screenshot:** Kafka UI → Consumer Group `lab-lag-drill-g1`.

---

## Task 5. Scaling — 3 consumers

In three terminals (or one after another), run with a single `group.id` and a large `max.poll.records`:

```bash
docker exec -it mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.lag.drill \
  --group lab-lag-drill-g1 \
  --consumer-property max.poll.records=500
```

Repeat `--describe` every 30 s until **LAG=0** everywhere.

---

## Task 6. Incident report (template)

| Field | Value |
|------|----------|
| Symptom | lag ↑ on `lab-lag-drill-g1` |
| T0 total lag | … |
| Hot partition | … |
| Action | +2 consumers |
| T1 lag=0 | … min |

---

## Success criteria

- [ ] A burst of **5000** messages.
- [ ] You recorded **LAG > 0** and the hot partition.
- [ ] You caught up to **LAG=0** by scaling the group.
- [ ] You filled in the mini-report.

**Next:** [19. Security](19-security-basics.md).
