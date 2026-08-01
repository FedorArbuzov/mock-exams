# 08. Lab: Streams and consumer group (comparison with Kafka)

## Lab goal

On the **single** stand create a stream, two **consumer groups** (like `team-a` / `team-b` in [kafka-basic 07](../kafka-basic/07-lab-consumer.md)), process messages with `XACK`, and inspect **pending**.

## Prerequisites

```bash
cd deploy/redis
docker compose -f docker-compose.sentinel.yml down 2>/dev/null || true
docker compose -f docker-compose.replication.yml down 2>/dev/null || true
docker compose up -d
```

---

## Task 1. Create a stream and events

```bash
docker exec mock-redis redis-cli DEL lab:stream:shop
docker exec mock-redis redis-cli XADD lab:stream:shop * event order.created orderId 1001
docker exec mock-redis redis-cli XADD lab:stream:shop * event order.created orderId 1002
docker exec mock-redis redis-cli XADD lab:stream:shop * event order.paid orderId 1001
docker exec mock-redis redis-cli XRANGE lab:stream:shop - +
```

**What you'll see:** three entries with automatic IDs.

---

## Task 2. Two groups — independent reading

**Why:** like two Kafka consumer groups on one topic.

```bash
docker exec mock-redis redis-cli XGROUP CREATE lab:stream:shop warehouse 0 MKSTREAM
docker exec mock-redis redis-cli XGROUP CREATE lab:stream:shop analytics 0
```

Group `warehouse`:

```bash
docker exec mock-redis redis-cli XREADGROUP GROUP warehouse wh-1 COUNT 10 STREAMS lab:stream:shop >
```

Group `analytics` (same stream):

```bash
docker exec mock-redis redis-cli XREADGROUP GROUP analytics an-1 COUNT 10 STREAMS lab:stream:shop >
```

**What you'll see:** both groups got **all three** messages — a separate cursor per group (analog of offsets in `__consumer_offsets`).

---

## Task 3. ACK and pending

Process only the first message in `warehouse` (substitute the ID from the output):

```bash
# example: ID=1716032400000-0
docker exec mock-redis redis-cli XACK lab:stream:shop warehouse 1716032400000-0
docker exec mock-redis redis-cli XPENDING lab:stream:shop warehouse
```

**What you'll see:** pending has unacked entries (2 more).

Ack the rest:

```bash
docker exec mock-redis redis-cli XACK lab:stream:shop warehouse 1716032400001-0 1716032400002-0
```

(replace IDs with yours)

---

## Task 4. New messages only for `>`

```bash
docker exec mock-redis redis-cli XADD lab:stream:shop * event order.shipped orderId 1001
docker exec mock-redis redis-cli XREADGROUP GROUP warehouse wh-1 COUNT 1 STREAMS lab:stream:shop >
```

**What you'll see:** only `order.shipped`.

---

## Task 5. Comparison with Kafka (table in your notebook)

Fill from memory using [07-streams](07-streams.md) and [kafka-basic 06](../kafka-basic/06-consumer.md):

| Question | Kafka | Redis Streams |
|--------|-------|---------------|
| Where is the group offset stored? | `__consumer_offsets` | entries in the stream + PEL |
| Consumer scale | ≤ partitions | several consumers in a group on one stream |
| 7-day TB retention | yes | limited by Redis RAM/disk |

---

## Task 6. Trim (optional)

```bash
docker exec mock-redis redis-cli XADD lab:stream:shop MAXLEN ~ 2 * event ping 1
docker exec mock-redis redis-cli XLEN lab:stream:shop
```

**What you'll see:** length ~2 (approximate).

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | Stream contains ≥3 events |
| 2 | `warehouse` and `analytics` both read history from `0` |
| 3 | `XPENDING` showed non-ACK entries until full `XACK` |
| 4 | `>` returns only new entries |
| 5 | Kafka comparison table is filled |

Next lesson: [09. ACL](09-acl.md).
