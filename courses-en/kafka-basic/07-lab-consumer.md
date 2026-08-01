# 07. Lab: two consumers in one group

## Lab goal

Run **two** consumers with **one** `group.id` on a topic with several partitions — see **partition** splitting. Then add a third consumer and observe **rebalance** (in logs / UI).

## Prerequisites

- Kafka stand running.
- [03](03-lab-first-topic.md) and [06. Consumer](06-consumer.md) completed.

---

## Task 1. Topic with 3 partitions

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.cg-demo \
  --partitions 3 --replication-factor 1 \
  --if-not-exists
```

Fill the topic (no key — distribution across partitions):

```bash
for i in $(seq 1 12); do
  echo "msg-$i" | docker exec -i mock-kafka \
    /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 \
    --topic lab.cg-demo
done
```

---

## Task 2. First consumer of group `lab-workers`

**Terminal 1** (leave it running):

```bash
docker exec -it mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.cg-demo \
  --group lab-workers \
  --from-beginning \
  --property print.partition=true \
  --property print.consumer.group=true
```

**What you’ll see:** all 12 messages (first group start) with different `partition=0|1|2`.

Stop with **Ctrl+C**.

---

## Task 3. Two consumers in parallel

Reset the group for a clean experiment (optional):

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group lab-workers --reset-offsets \
  --to-earliest --topic lab.cg-demo --execute
```

**Terminal 1:**

```bash
docker exec -it mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.cg-demo \
  --group lab-workers \
  --property print.partition=true \
  --property print.consumer.id=true
```

**Terminal 2** — the same command.

Add **new** messages:

```bash
for i in $(seq 13 18); do
  echo "msg-$i" | docker exec -i mock-kafka \
    /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 \
    --topic lab.cg-demo
done
```

**What you’ll see:** each terminal gets **part** of the partitions (not necessarily equal message counts). Different `consumer.id` in the output.

---

## Task 4. Describe the group

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group lab-workers --describe
```

**What you’ll see:** table `PARTITION`, `CURRENT-OFFSET`, `LOG-END-OFFSET`, `LAG` (if there is data).

| PARTITION | CONSUMER-ID | LAG |
|-----------|-------------|-----|
| 0 | … | 0 |
| 1 | … | 0 |
| 2 | … | 0 |

---

## Task 5. Third consumer (extra)

Start a **third** terminal with the same group.

**What you’ll see:** one consumer **idle** (0 partitions) — rule: partitions are not assigned “to two at once”; consumers beyond partition count get none.

Stop the extra terminal.

---

## Success criteria

- [ ] Topic `lab.cg-demo` with 3 partitions and ≥12 messages
- [ ] Two parallel consumers in group `lab-workers` both received messages
- [ ] `--describe` shows partition assignment per consumer
- [ ] Third consumer did not increase parallelism beyond 3 partitions

## Takeaways for work

- Read scale ≤ number of **partitions**.
- `kafka-consumer-groups.sh --describe` — first tool when “the queue is piling up”.

Next lesson: [08. Retention](08-retention.md).
