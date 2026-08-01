# 14. Failures: rebalance, duplicates, consumer lag

## Intro: “after deploy, lag is 2 million”

A night release added consumer pods. In the morning **lag** on topic `payments.events` — 2M messages, alert firing, CFO asking about report delay. Causes: **rebalance storm**, **slow processing**, **not enough partitions**, or consumer **crashed** without commit. The basic course covers **diagnosing symptoms**, not every remedy.

## What you'll learn

- **Rebalance**: when it happens and why it hurts.
- **Duplicates** with at-least-once.
- **Consumer lag**: definition and where to look.
- First remediation steps.

## Rebalance

**Rebalance** — redistributing partitions among consumers in a group.

Triggers:

- consumer join/leave;
- session timeout (consumer not polling/heartbeating);
- topic metadata change (new partition);
- subscription change.

Symptoms:

- **stop-the-world** spike (older consumers);
- short **lag growth** on all partitions;
- duplicates when commit is **after** rebalance (processing repeated).

Mitigation (intermediate+):

- `cooperative-sticky` assignor;
- increase `session.timeout` / reduce batch processing time;
- **static membership** (`group.instance.id`).

## Duplicates

At-least-once chain:

1. Consumer processed the message.
2. Crashed **before** commit.
3. New consumer reads from the **last committed** offset → **replay**.

App-level fixes:

- **idempotency key** = `eventId`;
- unique index in the DB;
- **upsert** instead of blind insert.

Producer retry without idempotence → **two** identical messages in the log — also duplicates.

## Consumer lag

```text
lag(partition) = log_end_offset - committed_offset
```

| Lag | Interpretation |
|-----|----------------|
| 0 | consumer keeps up |
| growing | consumer slower than produce |
| spike | rebalance, deploy, pause |
| ∞ (no commit) | consumer not working / not in group |

Where to look:

- `kafka-consumer-groups.sh --describe`
- Kafka UI [http://localhost:8080](http://localhost:8080)
- Prometheus: `kafka.consumer.lag` (burrow, kafka-exporter)

## Other failures (overview)

| Symptom | Possible cause |
|---------|----------------|
| `NotLeaderForPartition` | rolling restart of broker |
| `RecordTooLarge` | payload > limit |
| Consumer not reading | wrong topic subscription, ACL |
| Offset out of range | retention deleted data |

## On the stand: artificial lag

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.lag-demo --partitions 1 --replication-factor 1 --if-not-exists

for i in $(seq 1 50); do echo "m-$i" | docker exec -i mock-kafka \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 --topic lab.lag-demo; done
```

Starting a consumer **without** finishing, but **slowly**, won’t work in console — for lab [15](15-lab-lag.md) use the UI and a group that does **not** read.

Check lag without a consumer:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group ghost --describe 2>/dev/null || true
```

Create a group, read 10 messages and stop — lag remains:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.lag-demo \
  --group partial-reader \
  --max-messages 10 \
  --timeout-ms 15000

docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group partial-reader --describe
```

**What you’ll see:** `LAG` > 0 on partition 0.

## Common mistakes

| Mistake | Consequence |
|---------|-------------|
| Commit before DB write | loss on crash |
| Commit after DB, crash before commit | duplicate |
| 10 consumers on 2 partitions | 8 idle, lag doesn’t drop |
| Ignoring lag alert | hours of analytics delay |
| Reset offsets on prod without a runbook | reprocessing/loss |

## In production

- SLO on **max lag** for critical consumers.
- **Canary deploy** of consumers; limit max poll records on release.
- Runbook: scale consumers → check partition count → profile the handler.
- **DLQ** + alert on DLQ rate growth.

## Summary

**Rebalance** redistributes partitions and can cause pauses and duplicates. **Lag** is the main lag indicator. **Duplicates** are the normal cost of at-least-once without idempotency.

## Checklist

- Lag formula?
- Why can duplicates happen after a consumer restart?
- Will 20 pods help with 4 partitions?
- Where in the UI do you check lag?

Next lesson: [15. Lab: lag in UI](15-lab-lag.md).
