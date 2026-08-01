# 02. Lab: replication RF=3 and min.insync.replicas

## Lab goal

Bring up the **cluster**, create a topic with **RF=3**, verify the **ISR**, reproduce the failure of one broker, and observe the behavior of **describe** and produce with `acks=all`.

## Prerequisites

- [01. Replication](01-replication.md).
- The cluster:

```bash
cd deploy/kafka
docker compose -f docker-compose.cluster.yml up -d
```

Bootstrap: **host** `localhost:9091,localhost:9092,localhost:9093`; **in the container** `kafka-1:9092`.

---

## Task 1. Check the cluster

```bash
docker compose -f docker-compose.cluster.yml ps
docker exec mock-kafka-1 /opt/kafka/bin/kafka-broker-api-versions.sh \
  --bootstrap-server kafka-1:9092
```

**What you'll see:** exit 0, a list of API versions.

---

## Task 2. Topic with RF=3

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.replication \
  --partitions 6 --replication-factor 3

docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.replication
```

**What you'll see:** 6 partitions; each has `Replicas: …` with three ids; `Isr` matches replicas (all in sync).

Write down the **Leader** for partition 0 in your notes.

---

## Task 3. Produce with confirmation

```bash
printf 'k1|msg-1\nk2|msg-2\n' | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.replication \
  --producer-property acks=all \
  --property parse.key=true --property key.separator='|'
```

Read it back:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.replication \
  --from-beginning --timeout-ms 5000
```

**What you'll see:** both messages.

---

## Task 4. Stop the broker that is the leader

1. From describe of partition 0, find the **Leader** (e.g. `2` → container `mock-kafka-2`).
2. Stop it:

```bash
docker stop mock-kafka-2
```

3. Describe again (wait 10–30 s):

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.replication | head -20
```

**What you'll see:** for the affected partitions a new **Leader** on a live broker; `Isr` without the stopped id; `Replicas` still has three ids.

---

## Task 5. min.insync.replicas (concept on the stand)

The cluster already has `min.insync.replicas=2`. Try to produce with **two** brokers stopped (carefully — only on the training stand):

```bash
docker stop mock-kafka-3
# one broker of three remains — ISR for many partitions = 1
```

```bash
printf 'k3|after-outage\n' | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.replication \
  --producer-property acks=all \
  --property parse.key=true --property key.separator='|' 2>&1
```

**What you'll see:** an error like **NotEnoughReplicas** / timeout — a write with `acks=all` does not go through when ISR < min ISR.

---

## Task 6. Recovery

```bash
docker start mock-kafka-2 mock-kafka-3
sleep 20
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --topic lab.replication | head -5
```

**What you'll see:** the ISR is full again; produce with `acks=all` succeeds again.

---

## Success criteria

- [ ] Topic **lab.replication** with **6** partitions and **RF=3**.
- [ ] After stopping one broker the cluster **re-elects a leader**, consumer/produce from live brokers work.
- [ ] When min ISR is violated, produce with **acks=all** does **not** mask the problem with a silent success.
- [ ] You briefly explained the **RF / ISR / min.insync.replicas / acks=all** link in 3–5 sentences.

**Next:** [03. Producer tuning](03-producer-tuning.md).
