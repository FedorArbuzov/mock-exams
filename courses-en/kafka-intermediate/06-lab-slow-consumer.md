# 06. Lab: slow consumer and lag

## Lab goal

Load a topic, run a consumer with a **small** `max.poll.interval.ms` (simulating "long processing" via a pause in the script — optional), or more simply: one consumer for **many** messages and a second consumer in the group — observe **lag** and the behavior of the **consumer group**.

## Prerequisites

- [05. Consumer tuning](05-consumer-tuning.md).

---

## Task 1. Topic and loading

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server kafka-1:9092 \
  --create --topic lab.slow.consumer \
  --partitions 6 --replication-factor 3

for i in $(seq 1 2000); do
  printf 'ord-%04d|event-%s\n' "$((i % 50))" "$i"
done | docker exec -i mock-kafka-1 \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.slow.consumer \
  --producer-property acks=all \
  --property parse.key=true --property key.separator='|'
```

---

## Task 2. The "slow" consumer (one in the group)

Terminal A — read with a small `max.poll.records` and without auto-commit (manual mode via properties):

```bash
docker exec -it mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.slow.consumer \
  --group lab-slow-g1 \
  --consumer-property max.poll.records=10 \
  --consumer-property enable.auto.commit=true
```

Interrupt after a few seconds (**Ctrl+C**) — some of the messages have been processed.

---

## Task 3. Lag via CLI

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --group lab-slow-g1
```

**What you'll see:** the columns **CURRENT-OFFSET**, **LOG-END-OFFSET**, **LAG** per partition; LAG > 0 on the unprocessed ones.

---

## Task 4. A second consumer in the group

Terminal B:

```bash
docker exec -it mock-kafka-1 /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server kafka-1:9092 \
  --topic lab.slow.consumer \
  --group lab-slow-g1 \
  --consumer-property max.poll.records=500
```

**What you'll see:** a **rebalance** — the partitions are split between the consumers; the total lag drops faster.

Describe the group again:

```bash
docker exec mock-kafka-1 /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server kafka-1:9092 \
  --describe --group lab-slow-g1
```

---

## Task 5. Catch lag up to zero

Wait until both consumers process the tail (or stop one, and the other finishes reading). LAG across all partitions = **0**.

---

## Task 6. (Optional) max.poll.interval

In a Java/Kotlin application, when processing exceeds `max.poll.interval.ms` you get a `CommitFailedException` / an exception from poll. This can't be reproduced on the CLI — write in your report: **long processing without poll → exclusion from the group**.

---

## Success criteria

- [ ] **2000** messages in the topic, RF=3.
- [ ] `kafka-consumer-groups --describe` showed **LAG > 0**, then **0**.
- [ ] Adding a second consumer to the **same group** redistributed the partitions.
- [ ] You linked lag with **processing speed** and the number of consumers in the group.

**Next:** [07. Rebalance](07-rebalance.md).
