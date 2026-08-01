# 06. Asynchrony and event-driven architecture

## Intro

Sync couples the **lifetimes** of requests: billing slows down checkout. **Events** decouple domains in time; the price is **eventual consistency** and debugging complexity.

---

## Event notification vs event-carried state

| | Notification | Carried state |
|--|--------------|---------------|
| Payload | `order_id` | full snapshot or delta |
| Coupling | consumer calls the API | fatter message, less sync |
| Risk | chatty sync | stale data in the event |

```json
// notification
{ "type": "OrderPaid", "order_id": "ord_42" }

// carried state
{ "type": "OrderPaid", "order": { "id": "ord_42", "total": 99.5, "items": [...] } }
```

---

## Event-driven building blocks

```text
Producer → [Topic/Exchange] → Consumer Group A
                            → Consumer Group B
```

| Pattern | Usage |
|---------|---------------|
| **Pub/Sub** | fan-out (email + analytics) |
| **Competing consumers** | scaling processing |
| **Partition key** | ordering within `order_id` |

Broker choice: [messaging-deep](../messaging-deep/README.md).

---

## Choreography

Services react to events **without a central orchestrator**:

```text
OrderPaid → Inventory reserves
         → Billing captures
         → Notification sends
```

| + | − |
|---|---|
| loose coupling | hard to understand the global flow |
| no SPOF orchestrator | no single place for the saga's state |

---

## When not events

| Situation | Better |
|----------|-------|
| Need a "yes/no" answer now | sync |
| One consumer, a task for a worker | queue ([python-celery](../python-celery/README.md)) |
| Critical audit with immediate read-your-writes | be careful with async |

---

## Event schema evolution

| Change | Compatibility |
|-----------|---------------|
| New optional field | backward compatible |
| Removing a field | breaking — new `event_type` or version |
| Rename | new field + deprecate |

**Schema Registry** (Kafka): [kafka-intermediate](../kafka-intermediate/README.md).

---

## In mock-exams

| Topic | Course |
|------|------|
| Kafka basics | [kafka-basic](../kafka-basic/README.md) |
| Rabbit fanout | [rabbitmq-basic/06](../rabbitmq-basic/06-pubsub-fanout.md) |
| SQS/EventBridge | [aws-intermediate/07,09](../aws-intermediate/07-sqs-dlq.md) |
| Celery pipeline | [python-celery/19–20](../python-celery/19-workflows-canvas.md) |

---

## Subtasks

**Time:** ~55–65 min.

### 6.1 Event catalog (20 min)

For the Order domain, write down **8 events**. For each: producer, consumers (list), notification vs carried state.

### 6.2 Partition key (10 min)

For `OrderPaid`, which key? What happens with the wrong key (a reorder example)?

### 6.3 Choreography diagram (15 min)

Mermaid sequence or ASCII: happy path + one fail path (who compensates — without saga details yet).

### 6.4 Sync vs async decision (10 min)

A table of 5 operations (create order, send email, check fraud, get product, charge card): sync/async + why.

### 6.5 Schema change (10 min)

Scenario: you added `tax_id` to Order. How do you roll it out without stopping the old consumers?

---

## Summary

Events are for **fan-out and decoupling in time**. Document the event catalog and schema evolution rules; don't replace all sync with them without a reason.

---

## Checklist

- [ ] Event catalog with producers/consumers?
- [ ] Partition key justified?
- [ ] Breaking event change = new version?

**Next:** [07. API Gateway, BFF, and mesh](07-gateway-bff-mesh.md).
