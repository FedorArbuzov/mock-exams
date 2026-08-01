# 05. TTL, priorities, and chains with DLX

## Intro: "orders went stale, and the payment slots are taken"

In a marketplace, a payment slot reservation lives for **15 minutes**. If the buyer doesn't pay, the order should leave the "hot" queue and move to **cancelled** or to a DLQ for analytics — without endless requeue. **TTL** (Time-To-Live) in RabbitMQ sets the lifetime of a message or a queue; when it expires, the broker **deletes** or **dead-letters** the message — if a DLX is configured.

**Priorities** (`x-max-priority`) let VIP orders overtake regular ones — but only on **classic** queues, not on quorum. The intermediate skill is choosing the right queue type for the scenario.

## What you'll learn

- **Per-message TTL** (`expiration` in AMQP) vs **queue TTL** (`x-message-ttl`).
- **Queue TTL** (`x-expires`) — auto-deleting an empty queue.
- The **TTL + DLX** combination (delayed dead letter).
- **Priority queues** and quorum limitations.
- The **retry → DLQ** chain (overview for lab 06).

---

## TTL on a message

At publish time, set the **`expiration`** property (a string of milliseconds in AMQP 0-9-1):

```text
expiration: "60000"   # 60 seconds from the moment it enters the queue
```

The message is destroyed or moves to the DLX when the TTL expires **at the head of the queue** (important: expiry is only checked for messages at the front — long "tails" with a short TTL may wait).

## TTL on a queue

An argument at declare time:

```json
{
  "arguments": {
    "x-message-ttl": 900000,
    "x-dead-letter-exchange": "dlx.orders",
    "x-dead-letter-routing-key": "expired"
  }
}
```

All messages in the queue get the same TTL when they arrive.

## Queue expires

`x-expires` — how many **milliseconds without consumers** before the queue itself is deleted (rarely used in production on named work queues).

## Priorities (classic)

```json
{
  "arguments": {
    "x-max-priority": 10
  }
}
```

At publish: `priority: 0..10`. The broker delivers higher-**priority** messages to the consumer first (when there's a backlog).

| Queue type | Per-message TTL | Priority |
|-------------|-----------------|----------|
| classic | yes | yes |
| quorum | limited / queue-level | no |

For VIP + HA: split into **two queues** (vip / standard) or use classic while understanding the HA risks.

## The TTL → DLX → DLQ chain

```text
orders.checkout  (x-message-ttl=15m, DLX=dlx.orders, rk=expired)
    → on expiry → dlx.orders → orders.expired
```

A separate binding for `expired` vs `failed` (from a nack) means a different runbook for ops.

## Comparison with Kafka retention

| | RabbitMQ TTL | Kafka retention |
|---|--------------|-----------------|
| Granularity | message / queue | topic / partition log |
| After expiry | drop or DLX | delete by log retention |
| Delayed delivery | delayed message plugin / TTL+DLX | no built-in delay in core |

## Common mistakes

- Expecting a precise expire in a deep queue — it's checked from the head.
- Priority on quorum — a declare error.
- TTL without DLX — a **silent loss** of the message.
- Confusing `expiration` on publish with `x-message-ttl` on the queue.

## Summary

TTL manages the "freshness" of work; paired with DLX it's a controlled path into the DLQ. Priority is a tool of classic queues; for quorum, plan separate queues or exchange-level routing.

## Checklist

- The difference between message TTL and queue `x-message-ttl`?
- Where does a message go on TTL when a DLX is configured?
- Why isn't priority available on quorum?
- How do you separate "expired" from "failed" in the DLX?

Next lesson: [06-lab-ttl-dlx-chain.md](06-lab-ttl-dlx-chain.md).
