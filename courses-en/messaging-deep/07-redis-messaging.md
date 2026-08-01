# 07. Redis: Pub/Sub, Lists, Streams

## Intro

Redis is an **in-memory data store**; messaging is a **secondary** role. The mistake: "we already have Redis — let's build the whole bus on Pub/Sub".

[redis-basic/16](../redis-basic/16-vs-memcached-kafka.md), [redis-intermediate/13](../redis-intermediate/13-reliability.md).

---

## Three mechanisms

| Mechanism | Model | Persistence | Replay |
|----------|--------|---------------|--------|
| **Pub/Sub** | broadcast | no | no |
| **List** (LPUSH/BRPOP) | simple queue | if AOF/RDB | no backlog for offline consumers |
| **Streams** (XADD/XREADGROUP) | log-like | yes | yes, limited |

---

## Pub/Sub — when

- live UI notifications;
- cache invalidation broadcast;
- **loss** with an offline consumer is **acceptable**.

**Not for:** billing, payments, audit.

---

## Lists — when

- a simple job queue **inside** a monolith;
- short tasks, a single worker type;
- moderate volume.

**Risk:** no DLQ out of the box, blocking on a single Redis.

---

## Streams — when

- Redis is already in the stack;
- **moderate** event volume;
- consumer groups, pending, XACK;
- you don't need Kafka ops.

**Not for:** multi-TB retention, the Flink ecosystem.

```text
XADD orders * field value
XREADGROUP GROUP billing consumer1 COUNT 10 STREAMS orders >
```

---

## Redis vs Kafka (briefly)

| | Redis Streams | Kafka |
|---|---------------|-------|
| Retention | memory + maxlen | disk, large |
| Ecosystem | limited | huge |
| Ops | a single Redis/Cluster | KRaft cluster |
| Latency | very low | low |

---

## Summary

Redis messaging is **auxiliary**. The cache stays the main thing; Streams is a **small** event bus, not a replacement for MSK.

---

## Checklist

- [ ] Pub/Sub or Streams for your case?
- [ ] Is maxlen configured on the stream?
- [ ] Is message loss on a consumer restart acceptable?

**Next:** [08. AWS EventBridge](08-aws-eventing.md).
