# 11. Hybrid designs and migrations

## Intro

Mature companies are rarely "Kafka only". More often it's **layers**: a log for facts, a queue for tasks, Redis for caching and lightweight jobs.

---

## Common hybrids

### Kafka + SQS

```text
Kafka (orders.events) ──► connector/λ ──► SQS ──► legacy worker
```

Legacy doesn't read Kafka; an adapter translates the model.

### Rabbit + Kafka

```text
Monolith (Rabbit tasks) ──outbox/bridge──► Kafka (new services)
```

Gradual migration of a domain.

### Redis Streams + Kafka

Short **real-time** notifications in Redis; the **canonical** log in Kafka.

**Anti-pattern:** two sources of truth without sync.

---

## EventBridge + MSK

```text
AWS services → EventBridge → Lambda → MSK topic
App → MSK (primary analytics)
```

EventBridge for **cloud native**; MSK for **heavy** consumers.

---

## Choosing a primary bus

| Criterion | Decision |
|----------|---------|
| Source of truth for "what happened" | one primary log |
| Task execution | queue (SQS/Rabbit) |
| Integration glue | EventBridge |

Document it in an **ADR**.

---

## Strangler migration

1. New events → Kafka.
2. The old Rabbit consumer **dual-reads** (behind a flag).
3. Turn off the Rabbit path.
4. Decommission the exchange.

---

## Summary

A hybrid is the **norm**; chaos is **two primary logs** with no owner.

---

## Checklist

- [ ] Where is the canonical event store?
- [ ] Is there a bridge with lag monitoring?
- [ ] Is there a plan to turn off the legacy broker?

**Next:** [12. System design](12-system-design.md).
