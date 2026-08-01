# 07. Streams: event log in Redis

## Intro: "we need a queue, but Kafka is too early"

The team wants an **event log** with multiple subscribers and ACK, but standing up Kafka for 500 messages per minute is expensive. **Redis Streams** (since Redis 5) give an append-only log with IDs, **consumer groups**, a pending list, and `XACK` — closer to Kafka than List + BLPOP, but within a single Redis.

Comparing with [`kafka-basic`](../kafka-basic/README.md) helps keep the boundaries clear.

## What you'll learn

- `XADD`, `XREAD`, `XRANGE`.
- **Consumer group**: `XGROUP CREATE`, `XREADGROUP`, `XACK`, `XPENDING`.
- Similarities and differences vs Kafka topic/partition/offset.
- When Streams, and when Kafka or List.

## Data model

A stream is an ordered log of entries. Default ID: `millisecondsSequence` (e.g. `1716032400000-0`).

```text
XADD orders:events * orderId 1001 status created
```

Fields are flat key-value (like a HASH in one entry).

## Consumer group — Kafka analogy

| Kafka ([06-consumer](../kafka-basic/06-consumer.md)) | Redis Streams |
|------------------------------------------------------|---------------|
| Topic | Stream key (`orders:events`) |
| Partition | one stream ≈ one partition* |
| Offset | message ID |
| Consumer group | `XGROUP CREATE` |
| commit offset | `XACK` |
| lag | `XPENDING`, `XINFO GROUPS` |
| rebalance | no automatic; multiple consumers in a group share messages |

\* Scaling writes in Redis Streams means **sharding** several stream keys (`orders:0`, `orders:1`), not built-in partitions like Kafka.

## Reading

**Without a group** — `XREAD BLOCK`:

```bash
XREAD COUNT 10 BLOCK 5000 STREAMS orders:events $
```

**With a group** — each message to one consumer in the group:

```bash
XGROUP CREATE orders:events billing $ MKSTREAM
XREADGROUP GROUP billing consumer-1 COUNT 1 STREAMS orders:events >
```

`>` — only new, not yet delivered to the group. After processing:

```bash
XACK orders:events billing <message-id>
```

Unacked entries are in the **PEL** (Pending Entries List); `XCLAIM` takes them when a consumer dies.

## Comparison with Kafka — when to use what

| Criterion | Redis Streams | Kafka |
|----------|---------------|-------|
| Volume, TB retention | weak | strong |
| Multi-DC, schema contracts | Kafka + Schema Registry | Streams is not a replacement |
| Already have Redis, few events | Streams | overkill |
| Task queue worker×N | Streams or List | usually overkill |
| On-disk guarantees, year-long replay | Kafka | Streams + AOF are limited |

More on Kafka consumers: [07-lab-consumer](../kafka-basic/07-lab-consumer.md).

## On the stand (single)

```bash
cd deploy/redis
docker compose down
docker compose up -d
docker exec mock-redis redis-cli XADD lab:stream:orders * sku BOOK-1 qty 2
docker exec mock-redis redis-cli XRANGE lab:stream:orders - +
```

## Common mistakes

| Symptom | Cause | Solution |
|---------|---------|---------|
| Messages "stuck" | no `XACK` | ACK after side effect |
| Duplicate processing | at-least-once | idempotency by `orderId` |
| Stream grows unbound | no `MAXLEN` | `XADD ... MAXLEN ~ 10000` |
| One consumer slows down | hot key | shard stream keys |
| BUSYGROUP | group already exists | `XGROUP CREATE ... MKSTREAM` or ignore |

## In production

- **MAXLEN ~** for approximate trim — less CPU.
- DLQ: separate stream `orders:dlq` for poison messages.
- Don't store in a stream what must live for **years** — archive to S3/data lake.
- Monitoring: stream length, `pel-count`, lag per group.

## Summary

Streams are a log with IDs and consumer groups, mentally close to a Kafka consumer group, but within one Redis. For the training stand use **single** `docker compose up -d`.

## Checklist

- How is `XACK` like committing an offset?
- What does `>` mean in `XREADGROUP`?
- Why is one stream key a bottleneck?
- When would you choose Kafka over Streams?

Next lesson: [08. Lab: consumer group](08-lab-streams-consumer.md).
