# 10. Outbox, inbox, and event sourcing

## Intro

The DB write went through, the publish to Kafka didn't (a crash in between). **Dual write** is a classic microservices bug. A **transactional outbox** atomically saves the business data and the "intent to publish."

---

## Transactional outbox

```text
BEGIN;
  INSERT INTO orders ...;
  INSERT INTO outbox (id, type, payload, created_at) VALUES ...;
COMMIT;

Relay process:
  SELECT * FROM outbox WHERE sent_at IS NULL FOR UPDATE SKIP LOCKED
  → publish to broker
  → UPDATE outbox SET sent_at = now()
```

| Component | Role |
|-----------|------|
| Business TX | order + outbox row |
| Relay | a separate worker / CDC |
| Broker | at-least-once delivery |

Details: [messaging-deep/10](../messaging-deep/10-outbox-saga.md), [fastapi/14 outbox mention](../fastapi/14-sessions-repos.md).

---

## Relay: polling vs CDC

| | Polling outbox | Debezium CDC |
|--|----------------|--------------|
| Simplicity | high | Kafka Connect infra |
| Latency | seconds | milliseconds–seconds |
| Event shape | an explicit domain event | all row changes |

---

## Inbox (consumer)

```sql
INSERT INTO inbox (message_id, received_at)
VALUES ($1, now())
ON CONFLICT (message_id) DO NOTHING
RETURNING message_id;
-- if NULL → already processed
```

Paired with an idempotent handler — **effectively-once processing**.

---

## Event sourcing (ES)

The aggregate's state = a **chain of events**, not the current row:

```text
OrderCreated + ItemAdded + OrderPaid → snapshot read model
```

| + | − |
|---|---|
| audit, replay | complexity, schema evolution |
| temporal queries | learning curve for the team |

Do **not** adopt ES everywhere — only where replay/audit is **justified**.

---

## CQRS + ES

The write side appends events; the read side is **projections** into convenient tables ([11-cqrs-read-models](11-cqrs-read-models.md)).

---

## When an outbox is enough

Most systems need an **outbox + ordinary tables**, not full ES:

| Need | Pattern |
|-------|---------|
| Reliable publish | outbox |
| History of all changes | ES |
| Fast lists | CQRS projection |

---

## In mock-exams

| Topic | Course |
|------|------|
| Outbox theory | [messaging-deep/10](../messaging-deep/10-outbox-saga.md) |
| Kafka Connect CDC | [kafka-intermediate/15](../kafka-intermediate/15-kafka-connect.md) |
| Celery worker | [python-celery](../python-celery/README.md) |

---

## Subtasks

**Time:** ~60–70 min.

### 10.1 Outbox schema (15 min)

Design the `outbox` table: columns, indexes, TTL/archival.

### 10.2 Failure scenarios (15 min)

Table: relay crashed after publish before marking sent | duplicate publish | event ordering — what the consumer does.

### 10.3 Inbox (10 min)

`inbox` DDL + handler pseudocode with dedup.

### 10.4 ES decision (15 min)

For Order: ES **yes/no** — 5 criteria. If no — what you use for audit instead.

### 10.5 Relay choice (10 min)

Polling vs CDC for your volume (an events/day estimate).

---

## Summary

The outbox is the **minimal must-have** for reliable events. ES is powerful but expensive; the inbox handles consumer dedup.

---

## Checklist

- [ ] No dual write without an outbox?
- [ ] Relay idempotent?
- [ ] ES justified?

**Next:** [11. CQRS and read models](11-cqrs-read-models.md).
