# 15. Lab: consumer lag in Kafka UI

## Lab goal

Accumulate **lag** on a training topic, see it in **CLI** and **Kafka UI**, then “catch up” the consumer to **LAG=0**.

## Prerequisites

- [`deploy/kafka`](../../deploy/kafka/README.md) with UI at [http://localhost:8080](http://localhost:8080).
- [14. Failures](14-failures.md).

---

## Task 1. Fill the topic

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.lag-ui \
  --partitions 2 --replication-factor 1 --if-not-exists

for i in $(seq 1 100); do
  echo "lag-msg-$i" | docker exec -i mock-kafka \
    /opt/kafka/bin/kafka-console-producer.sh \
    --bootstrap-server localhost:9092 --topic lab.lag-ui
done
```

---

## Task 2. Partial read

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.lag-ui \
  --group lab-lag-ui-workers \
  --max-messages 25 \
  --timeout-ms 20000
```

---

## Task 3. Lag in CLI

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group lab-lag-ui-workers --describe
```

**What you’ll see:** columns `LOG-END-OFFSET`, `CURRENT-OFFSET`, `LAG` — total ~75 (depends on distribution across 2 partitions).

Write down:

```text
Partition 0 LAG: ___
Partition 1 LAG: ___
```

---

## Task 4. Kafka UI

1. Open [http://localhost:8080](http://localhost:8080).
2. Consumers → group `lab-lag-ui-workers`.
3. Topic `lab.lag-ui` — lag per partition.

**Screenshot not required** — confirm UI matches CLI.

---

## Task 5. Catch up lag

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.lag-ui \
  --group lab-lag-ui-workers \
  --timeout-ms 30000
```

Ctrl+C after messages are exhausted.

Repeat `--describe`:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group lab-lag-ui-workers --describe
```

**What you’ll see:** `LAG` = **0** (or empty) on all partitions.

---

## Task 6. (Opt.) Slow consumer

While the consumer is **not** running, add 50 more messages and check lag again — it will grow. Discuss: in prod “slow” = long handler or small `max.poll.records`.

---

## Success criteria

- [ ] ≥100 messages in `lab.lag-ui`
- [ ] After 25 messages `LAG` > 0 in CLI
- [ ] UI shows the same group and lag
- [ ] After full consume `LAG` = 0

## Takeaways for work

- Alerts are built on **max lag** and **lag increase rate**.
- First on-call step: `--describe` + UI, not restarting at random.

Next lesson: [16. CLI](16-cli.md).
