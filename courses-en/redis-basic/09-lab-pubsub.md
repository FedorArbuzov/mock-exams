# 09. Lab: Pub/Sub — orders and cache invalidation

## Lab goal

Run **SUBSCRIBE** in the interactive CLI, send **PUBLISH** from a second terminal, check **PSUBSCRIBE** by a pattern. Model a **cache invalidation** signal.

## Prerequisites

- [08. Pub/Sub](08-pubsub.md).
- Two terminals (or tabs).
- Channels: **`lab:notify:`**

---

## Task 1. Subscriber (terminal A)

**Why:** to see push messages in real time.

```bash
docker exec -it mock-redis redis-cli
```

Inside the CLI:

```text
SUBSCRIBE lab:notify:orders
```

**What you'll see:** `Reading messages...` and a subscription confirmation (`subscribe`, count 1).

**Leave** window A open.

---

## Task 2. Publisher (terminal B)

```bash
docker exec mock-redis redis-cli PUBLISH lab:notify:orders '{"orderId":"ord-lab-1","event":"paid"}'
```

**What you'll see in A:** a `message` line, the channel `lab:notify:orders`, the JSON payload.

Repeat with a different event:

```bash
docker exec mock-redis redis-cli PUBLISH lab:notify:orders '{"orderId":"ord-lab-2","event":"created"}'
```

---

## Task 3. Without a subscriber

**Why:** to confirm at-most-once / no queue.

In B (with no active SUBSCRIBE):

```bash
docker exec mock-redis redis-cli PUBLISH lab:notify:ghost "lost"
docker exec mock-redis redis-cli PUBSUB NUMSUB lab:notify:ghost
```

**What you'll see:** `(integer) 0` subscribers — the message was delivered to no one.

---

## Task 4. Pattern subscribe (new terminal C, optional)

In C:

```bash
docker exec -it mock-redis redis-cli
```

```text
PSUBSCRIBE lab:notify:*
```

From B:

```bash
docker exec mock-redis redis-cli PUBLISH lab:notify:cache "invalidate:product:101"
docker exec mock-redis redis-cli PUBLISH lab:notify:alerts "cpu-high"
```

**What you'll see in C:** both messages on different "sub-channels" of the pattern.

---

## Task 5. Connection to cache-aside

**Why:** a typical pattern in production.

1. Put the cache:

```bash
docker exec mock-redis redis-cli SET lab:cache:product:101 '{"price":100}' EX 600
```

2. Publish the invalidation (a subscriber in the application would do `DEL`):

```bash
docker exec mock-redis redis-cli PUBLISH lab:notify:cache "DEL lab:cache:product:101"
```

3. Manually do what a worker would do:

```bash
docker exec mock-redis redis-cli DEL lab:cache:product:101
docker exec mock-redis redis-cli GET lab:cache:product:101
```

**What you'll see:** `(nil)` after the DEL.

---

## Task 6. Leaving the subscription

In terminals A/C: **Ctrl+C** or `UNSUBSCRIBE`.

---

## Success criteria

- [ ] SUBSCRIBE received ≥2 PUBLISH
- [ ] PUBSUB NUMSUB showed 0 for a channel with no subscribers
- [ ] (opt.) PSUBSCRIBE received messages from different channels
- [ ] You understand manual cache invalidation on an event

## What to take to work

- For SUBSCRIBE — a **separate** redis-cli / client connection.
- Pub/Sub does not replace a **queue**; for billing orders — Kafka/SQS.
- The payload is better kept **short** (id + event type).

Next lesson: [10. Pipeline and transactions](10-pipeline-transactions.md).
