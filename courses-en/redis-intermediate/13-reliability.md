# 13. Reliability: queues, BLPOP, at-least-once

## Intro: "the task vanished — the worker died after POP"

A queue on `LPUSH` / `RPOP` is simple, but `RPOP` **removes** the task immediately. The worker took the task and crashed — the work is **lost**. The **BLPOP** + **processing list** pattern (or Streams with `XACK`) gives **at-least-once**: the task is either done or returns to the queue.

## What you'll learn

- List-based queue: `LPUSH` + `BRPOP` / `BLPOP`.
- Reliable queue: `RPOPLPUSH` / `BRPOPLPUSH` (legacy) and the two-list scheme.
- **At-least-once**, idempotency, visibility timeout.
- When List, when Streams ([07](07-streams.md)).

## Simple queue (fire-and-forget)

```text
Producer: LPUSH queue:tasks "{id:1,payload:...}"
Worker:   BRPOP queue:tasks 0
```

Plus: simple. Minus: after `BRPOP` the message is **outside** Redis — crash = loss.

## Reliable queue (two lists)

```text
queue:pending     — new tasks
queue:processing  — taken by a worker
```

Atomically (Redis 6.2+ `LMOVE`, earlier `RPOPLPUSH`):

```bash
LMOVE queue:pending queue:processing RIGHT LEFT
```

After success:

```bash
LREM queue:processing 1 <task-json>
```

On worker crash — a **reaper**: moves old entries from `processing` back to `pending` (by timestamp in the payload or a separate ZSET heartbeat).

## BLPOP — blocking wait

```bash
BLPOP queue:tasks 5
```

Waits up to 5 seconds; good for a worker pool without a busy-loop.

## At-least-once and duplicates

| Guarantee | Behavior |
|----------|-----------|
| At-most-once | loss possible |
| At-least-once | duplicates possible |
| Exactly-once | hard; idempotency key in the DB |

The worker must handle `taskId` **idempotently** (`INSERT ... ON CONFLICT`).

## Streams vs List

| | List + LMOVE | Streams |
|--|--------------|---------|
| Complexity | low | medium |
| ACK / pending | manual | built-in PEL |
| Multiple consumers | compete on BRPOP | consumer group |
| Replay | harder | `XRANGE` |

For the intermediate course — both patterns; lab 14 — **List**.

## On the stand

```bash
docker exec mock-redis redis-cli DEL queue:pending queue:processing
docker exec mock-redis redis-cli LPUSH queue:pending '{"id":"t1"}'
```

## Common mistakes

| Symptom | Cause | Solution |
|---------|---------|---------|
| Tasks duplicate | retry without idempotency | key `processed:t1` |
| Tasks lost | RPOP only | pending/processing |
| Queue "stuck" | poison message | DLQ list, max retry |
| Whole Redis blocked | huge payload | size limit, S3 for body |
| Order broken | many workers | one shard or Streams |

## In production

- Metrics: length of `pending`, `processing`, age of oldest.
- DLQ: `queue:dead` after N attempts.
- For heavy pipelines — Kafka/Rabbit; Redis — **short** tasks.
- Don't use Redis as the **only** store for critical data without AOF/replication.

## Summary

A reliable Redis queue is an atomic move to processing + ACK + reaper. Guarantee — at-least-once; business logic — idempotent.

## Checklist

- Why is `BRPOP` alone not reliable?
- What does `LMOVE` between lists do?
- How do you detect "stuck" tasks?
- When would you choose Streams over List?

Next lesson: [14. Lab: BLPOP queue](14-lab-blpop-queue.md).
