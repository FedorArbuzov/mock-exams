# 08. Retention: time, size, segments, compaction

## Intro: “Kafka disk filled overnight”

Topic `app.logs` with no limit; default retention of **7 days** seemed enough — but volume is **terabytes per day**. The broker stopped accepting: `log.dir` is full. Retention in Kafka is not “delete from the queue after read”, but a **disk log retention policy** independent of consumers.

## What you'll learn

- **retention.ms** / **retention.bytes** on a topic.
- **Segment** log and index files.
- Difference between **delete** and **compact** policy.
- When **log compaction** is needed (overview).

## How a partition is stored on disk

Each partition is a directory on the broker:

```text
orders.events-0/
  00000000000000000000.log
  00000000000000000000.index
  00000000000000000000.timeindex
  ...
```

Records append to the **active segment**. When the segment reaches `segment.bytes` or `segment.ms` — it **rotates**, a new one opens.

Old segments are deleted when:

- age > **retention.ms**, or
- total partition size > **retention.bytes** (if set).

## Delete policy (default)

`cleanup.policy=delete` — segments older than retention are **deleted**. A consumer lagging longer than retention **cannot catch up** — data is gone.

| Topic parameter | Meaning |
|-----------------|---------|
| `retention.ms` | how long to keep (ms) |
| `retention.bytes` | max partition size |
| `segment.ms` | rotate by time |
| `segment.bytes` | rotate by size |

Global broker defaults: `log.retention.hours` (often 168 = 7 days).

## Compact policy (overview)

`cleanup.policy=compact` — for topics like a **changelog**: for each key the **latest** value remains.

Examples: `__consumer_offsets`, Connect offsets, KTable state in Kafka Streams.

Don’t confuse with delete: compact does **not** delete everything by time the same way — tombstones and `delete.retention.ms` (intermediate).

## Retention vs consumer offset

A consumer may commit offset **1000**, while retention deleted records up to **5000** — with `earliest` the consumer jumps to the available start.

**Lag** is measured from **log end** — if data is deleted, “catching up” is impossible.

## On the stand: view topic config

```bash
docker exec mock-kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 \
  --create --topic lab.retention-hint \
  --partitions 1 --replication-factor 1 \
  --config retention.ms=604800000 \
  --if-not-exists

docker exec mock-kafka /opt/kafka/bin/kafka-configs.sh \
  --bootstrap-server localhost:9092 \
  --entity-type topics --entity-name lab.retention-hint --describe
```

## Common mistakes

| Mistake | Consequence | Solution |
|---------|-------------|----------|
| Infinite retention on logs | full disk | retention.bytes + disk monitoring |
| Retention too short for replay | analytics didn’t catch up | increase ms or tiered storage |
| Compact on an event stream without keys | unpredictable | delete policy |
| Expecting “Kafka deletes after ACK” | confusion with queues | retention policy only |

## In production

- **Tiered storage** (KIP) — cold segments in S3.
- Separate cluster/topic for **audit** with long retention.
- Alerts: **disk usage**, **log size**.
- Legal requirements (GDPR) — do **not** keep PII in Kafka longer than needed; compaction doesn’t erase version history without tombstone design.

## Summary

Kafka keeps the log **on disk** per retention, not “until read”. Segments rotate and are deleted. **Compact** — for changelogs by key; **delete** — for event streams.

## Checklist

- What is deleted first with `retention.ms=3600000` (1 hour)?
- Consumer lags 2 days, retention 1 day — what happens?
- Why compact for `__consumer_offsets`?
- How does a segment differ from a topic?

Next lesson: [09. Lab: retention](09-lab-retention.md).
