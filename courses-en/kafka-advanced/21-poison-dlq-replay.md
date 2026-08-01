# 21. Poison message, DLQ, and safe replay

## Intro: "one message brings down the whole consumer"

JSON with an **invalid field** after deploying schema v2. The consumer crashes in a loop, **lag** grows, the rest of the messages aren't processed. You need a **DLQ**, **quarantine**, **replay** without sending duplicate SMS to the customer.

## What you'll learn

- **Poison pill** vs **transient** error.
- **DLQ** patterns (dead-letter queue/topic).
- **Retry** with backoff and max attempts.
- **Replay** and idempotency.
- Connect / Streams errors (overview).

**Lab:** [22-lab-dlq](22-lab-dlq.md).

---

## Error classification

| Type | Example | Strategy |
|-----|--------|-----------|
| Transient | DB timeout | retry with jitter |
| Poison | schema mismatch | DLQ after N tries |
| Bug | NPE on null | fix code, replay DLQ |

---

## DLQ topic design

```text
orders.events          → consumer billing
orders.events.dlq      → manual / tooling replay
orders.events.retry.30s → optional delay topic (retry tier)
```

| Practice | Why |
|----------|-------|
| Metadata in headers | `original-topic`, `offset`, `error`, `timestamp` |
| Same key as source | ordering on replay |
| Long DLQ retention | investigation |

---

## Consumer pseudo-flow

```text
while poll:
  for record in batch:
    try:
      process(record)
    except PoisonError:
      produce(dlq, enriched(record))
    except TransientError:
      retry buffer or seek back
  commitSync()
```

**Don't** commit before successful processing (at-least-once), or use transactions.

---

## Retry tiers (Kafka-native patterns)

1. **In-process** retry 3× — fast.
2. **Retry topic** with a delay (a separate consumer or a `delay` service) — offloading.
3. **DLQ** — human intervention.

**Exponential backoff** is not built into Kafka — implement it in the app or use **Kafka Connect** / **Spring Kafka** `DefaultErrorHandler`.

---

## Replay

| Step | Action |
|-----|----------|
| 1 | Fix bug / schema |
| 2 | Deploy |
| 3 | Consume DLQ → target topic (tool) |
| 4 | Monitor duplicate rate |

**Idempotency key** = `eventId` in a target DB unique index.

**Replay is not** a "seek to beginning" of a prod topic without understanding the side effects.

---

## Kafka Connect

- `errors.tolerance=all` — carefully, use `errors.deadletterqueue.topic.name`.
- **SMT** don't mask poison forever.

---

## Kafka Streams

- `default.deserialization.exception.handler`
- `ProcessingExceptionHandler` (version-dependent)
- Failed records → a **dead-letter topic** via a punctuator/custom

---

## Governance

- Alert on a **DLQ rate** spike.
- Runbook: who approves a replay in prod.
- PII in the DLQ — the same ACL as the source.

---

## In the interview

**Question:** "Exactly-once and DLQ?" — the DLQ is an at-least-once path; the EOS session is separate; replay is idempotent at the sink.

---

## Summary

A poison message is inevitable. **DLQ + metadata + idempotent replay** — the standard senior answer.

**Next:** [22-lab-dlq](22-lab-dlq.md).
