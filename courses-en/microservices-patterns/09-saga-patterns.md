# 09. Saga: orchestration and choreography

## Intro

"We need a distributed transaction" — in microservices that's a **saga**: a chain of **local** transactions with **compensating** steps on failure. Not 2PC in production ([messaging-deep/10](../messaging-deep/10-outbox-saga.md)).

---

## The problem

```text
Order (local TX) → Reserve inventory → Charge payment
                         ↓ fail
                   ??? rollback order
```

There's no single `COMMIT` across three DBs.

---

## Choreography saga

Each service listens for events and publishes the next one:

```text
OrderCreated → InventoryReserved | InventoryFailed
InventoryReserved → PaymentCaptured | PaymentFailed
PaymentFailed → InventoryReleased (compensate)
```

| + | − |
|---|---|
| no orchestrator SPOF | complex graph, "where did it get stuck" |
| loose coupling | duplicated transition rules |

---

## Orchestration saga

A central **orchestrator** (state machine):

```text
[Saga Orchestrator]
   ├─ command ReserveInventory
   ├─ command CapturePayment
   └─ on fail → CompensateInventory
```

| + | − |
|---|---|
| explicit saga state | the orchestrator is a critical component |
| easier debugging | risk of a "god orchestrator" |

Implementations: Temporal, Cadence, a custom state table + Celery ([python-celery](../python-celery/README.md)).

---

## Compensation ≠ undo

| Forward | Compensate |
|---------|------------|
| Reserve stock | Release stock |
| Capture payment | Refund (may be async!) |
| Send email | send a "cancelled" one (don't delete the email) |

Compensation is **semantic**; it isn't always symmetric.

---

## Idempotency of steps

Each saga step:

```text
saga_id + step_name → unique constraint
retried command → no-op or same result
```

Mandatory with at-least-once messaging.

---

## Timeouts and "hanging" sagas

| State | Action |
|-----------|----------|
| Payment pending > 15 min | auto cancel + compensate inventory |
| Unknown | human intervention + alert |

Saga state in the **orchestrator DB** or an event log.

---

## In mock-exams

| Topic | Course |
|------|------|
| Outbox + events | [messaging-deep/10](../messaging-deep/10-outbox-saga.md) |
| Celery canvas | [python-celery/19](../python-celery/19-workflows-canvas.md) |
| Idempotency | [api-design/08](../api-design/08-idempotency-retries.md) |

---

## Subtasks

**Time:** ~60–70 min.

### 9.1 Happy path (15 min)

Draw the "Place Order" saga (3 steps). Mark the local TX boundaries of each service.

### 9.2 Failure matrix (20 min)

Table: failing step | already executed | compensate | final Order status |

### 9.3 Choreography vs orchestration (15 min)

Pick a style for your case; 3 arguments; what's rejected.

### 9.4 State machine (10 min)

List the saga's states (`PENDING_PAYMENT`, …) and the allowed transitions.

### 9.5 Idempotency (10 min)

For the `CapturePayment` step, describe the dedup key and its storage.

---

## Summary

A saga is a **business process** with compensations, not an XA transaction. Choose orchestration when it's complex; choreography for simple fan-out — and document the timeouts.

---

## Checklist

- [ ] Compensations for each forward step?
- [ ] Saga state observable?
- [ ] Steps idempotent?

**Next:** [10. Outbox, inbox, and event sourcing](10-outbox-eventsourcing.md).
