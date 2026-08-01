# 06. Consumer: poll, group, offset commit

## Intro: “restarted the service — orders processed again”

Deploy of a new **Fulfillment** version. After restart the consumer reads `order.created` from yesterday again — duplicate shipments. Cause: **offset not committed** before successful processing, or `enable.auto.commit=true` committed **before** writing to the DB. A Kafka consumer is a **poll → process → commit** loop, not “subscribe like MQTT”.

## What you'll learn

- The **poll** loop and parameters `max.poll.records`, `session.timeout`.
- **Consumer group**, rebalance (overview).
- **Auto vs manual** offset commit.
- `auto.offset.reset`: `earliest` / `latest`.

## Consumer group — again

Group name: `group.id` (or `--group` in CLI).

The Kafka group coordinator:

1. Assigns partitions to consumers (**rebalance**).
2. Stores committed offsets in topic **`__consumer_offsets`**.

Two groups `billing` and `warehouse` on topic `orders.events` — **two independent** progresses along the feed.

## Poll loop

Client pseudocode (Java/Python/Go — same idea):

```text
subscribe(topics)
loop:
  records = poll(timeout)
  for record in records:
    process(record)
  commit_sync()   # or commit_async()
```

**poll** — heartbeats and receiving a batch of records. Long processing without poll → **session expired** → rebalance.

| Parameter | Meaning |
|-----------|---------|
| `max.poll.interval.ms` | max time between polls before the consumer is kicked |
| `max.poll.records` | how many records per poll |
| `session.timeout.ms` | when to consider the consumer dead |
| `heartbeat.interval.ms` | heartbeat frequency |

## Offset commit

| Mode | Behavior | Risk |
|------|----------|------|
| **auto commit** (`enable.auto.commit=true`) | periodic commit | processed with error — offset already advanced → **loss**; or commit before DB → **duplicate** on retry |
| **manual commit** | commit after success | classic at-least-once + idempotency |

**At-least-once:** a message may arrive **again** — normal; business logic must be **idempotent** (by `eventId`).

**Exactly-once** — transactional consumer + idempotent producer (intermediate).

## auto.offset.reset

If the group has **no** stored offset:

- `earliest` — from the start of retention;
- `latest` — only new;
- `none` — error (strict mode).

After an offset **reset** (`--reset-offsets`) behavior is set explicitly.

## Rebalance (overview)

Triggers: new consumer in the group, consumer left, timeout, partition count change.

During rebalance **all** consumers in the group may **pause** (stop-the-world in older clients; cooperative sticky — in newer ones).

More in [14. Failures](14-failures.md).

## On the stand: two groups

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.consume --partitions 1 --replication-factor 1 \
  --if-not-exists

echo 'shared-event' | docker exec -i mock-kafka \
  /opt/kafka/bin/kafka-console-producer.sh \
  --bootstrap-server localhost:9092 --topic lab.consume
```

Group A:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic lab.consume \
  --group team-a \
  --from-beginning \
  --timeout-ms 5000
```

Group B — same command with `--group team-b`.

**What you’ll see:** both groups got `shared-event` — different offsets in `__consumer_offsets`.

List groups:

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --list
```

## Common mistakes

| Symptom | Cause | Solution |
|---------|-------|----------|
| “Missing” old messages | new group + `latest` | `earliest` or intentional reset |
| Duplicates after deploy | at-least-once | idempotency key |
| Endless rebalance | processing > `max.poll.interval` | smaller batch, async processing, larger interval |
| Lag grows | few consumers / slow processing | scale consumers ≤ partitions |
| Reads only half the partitions | 2 consumers, 3 partitions, one “extra” | normal; add a consumer or reduce partitions |

## In production

- **Consumer lag** — the main metric (see [15. Lab: lag](15-lab-lag.md)).
- Graceful shutdown: `WakeupException`, commit before exit.
- **DLQ** topic for messages that don’t parse.
- In Kubernetes: **one consumer process per pod**, replicas = group scale.

## Summary

The consumer **poll**s a batch, processes, **commits** the offset. A group is the unit of scaling and one “progress” on a topic. Auto-commit is fine in labs; in prod **manual** after side effects is more common.

## Checklist

- Where does Kafka store the offset for group `billing`?
- How do `team-a` and `team-b` differ when reading the same topic?
- Why does at-least-once produce duplicates?
- What happens if processing a record takes 10 minutes without poll?

Next lesson: [07. Lab: consumer group](07-lab-consumer.md).
