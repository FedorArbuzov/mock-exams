# 16. Lab: URP — simulation on three brokers and recovery

## Lab goal

On a **3-broker** KRaft cluster, create a topic with **RF=3**, stop one broker, observe **URP**, restore ISR, and document a runbook.

## Prerequisites

- [15-troubleshooting](15-troubleshooting.md).
- RAM ≥ 4 GB.

```bash
cd deploy/kafka
docker compose down
docker compose -f docker-compose.cluster.yml up -d
```

Bootstrap inside the network: `kafka-1:9092`. From the host: `localhost:9091,9092,9093`.

---

## Task 1. Topic RF=3

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.urp.test \
  --partitions 6 --replication-factor 3 \
  --config min.insync.replicas=2

docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.urp.test
```

**What you'll see:** leaders on 1/2/3, ISR with 3 nodes.

---

## Task 2. Load (optional)

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-producer-perf-test.sh \
  --topic lab.urp.test \
  --num-records 50000 --record-size 1024 \
  --throughput 5000 \
  --producer-props bootstrap.servers=kafka-1:9092 acks=all \
  --if-exists
```

Or a few messages via the console producer.

---

## Task 3. Stop broker-2

```bash
docker stop mock-kafka-2
```

Wait 30–60 s.

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.urp.test
```

**What you'll see:** ISR size 2, possibly **Isr: 1,3** without 2; the URP metric in the UI or:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --under-replicated-partitions
```

Write down **which partitions** are affected.

---

## Task 4. Produce with acks=all at min ISR=2

Try to produce from the host or via exec:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.urp.test \
  --producer-property acks=all
```

**Expectation:** as long as ≥2 ISR are alive — success; if ISR=1 — `NOT_ENOUGH_REPLICAS`.

---

## Task 5. Recovery

```bash
docker start mock-kafka-2
```

After 1–2 min:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.urp.test
```

**What you'll see:** broker 2 back in ISR, URP → 0.

---

## Task 6. Runbook (written)

A 10-line template:

1. **Detect:** alert `UnderReplicatedPartitions`
2. **Assess:** offline vs URP only
3. **Mitigate:** restore broker / disk
4. **Validate:** describe topic, producer test
5. **Escalate:** if offline > 0 for > 15 min

---

## Task 7. Cleanup

```bash
docker compose -f docker-compose.cluster.yml down
docker compose up -d
```

---

## Success criteria

- [ ] Created an RF=3 topic with `min.insync.replicas=2`.
- [ ] Observed URP after stopping a broker.
- [ ] Restored ISR after starting it.
- [ ] A 10-line runbook.

## If it doesn't work

| Symptom | Solution |
|---------|---------|
| Cannot create RF=3 | are all 3 brokers healthy? |
| No URP after stop | wait; RF may show URP only on leader copies |
| Container names | `docker ps` — adjust mock-kafka-1/2/3 |

**Next:** [17-interview-qa](17-interview-qa.md).
