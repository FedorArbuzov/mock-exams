# 10. Outbox, inbox, transactional messaging

## Intro

"First write to the DB, then publish" — a crash between the steps → **inconsistency**. The **transactional outbox** is a pattern for **atomicity** of business data and events.

---

## Outbox pattern

```text
BEGIN;
  INSERT INTO orders ...;
  INSERT INTO outbox (event_type, payload) ...;
COMMIT;

relay (a separate process) reads outbox → publishes to Kafka/SQS → DELETE/MARK sent
```

| Pro | Con |
|------|-------|
| no dual-write problem | relay lag, publish idempotency |
| works with any broker | the outbox table schema |

[postgresql-developer](../postgresql-developer/README.md) — migrations; [kafka-connect](../kafka-intermediate/README.md) — a CDC alternative.

---

## CDC vs outbox

| | Outbox table | Debezium CDC |
|---|--------------|--------------|
| Explicit events | yes | all row changes |
| Schema control | high | changelog |
| Ops | relay app | Kafka Connect |

---

## Inbox (consumer side)

Dedup on receipt:

```text
INSERT INTO inbox (message_id) ON CONFLICT skip;
process;
```

Paired with an idempotent handler.

---

## Saga (briefly)

A distributed transaction via **compensating** steps:

```text
OrderCreated → ReserveInventory → ChargePayment
                    ↓ fail
              ReleaseInventory (compensate)
```

Orchestration (central) vs choreography (events only). The events are **Kafka/Rabbit**; the saga state is in the DB.

Don't confuse a saga with **2PC** (rare in microservices).

---

## Summary

A broker doesn't make a transaction with your DB — an **outbox** makes the link **reliable**.

---

## Checklist

- [ ] Is there dual-write without an outbox somewhere?
- [ ] Relay is at-least-once — is the publish idempotent?
- [ ] Are the saga compensations defined?

**Next:** [11. Hybrids](11-hybrid-migration.md).
