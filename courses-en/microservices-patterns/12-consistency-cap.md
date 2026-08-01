# 12. CAP, eventual consistency, and trade-offs

## Intro

"The order shows up in analytics right after payment" — under a network partition you **can't** guarantee everything at once. Microservices live in **eventual consistency**; the job is deciding **which** inconsistencies are acceptable and how to **fix** them.

---

## CAP (practically)

Under a partition (P), you choose between **C** (linearizable consistency) and **A** (availability):

| Choice | Example |
|-------|--------|
| CP | a bank ledger, etcd |
| AP | catalog cache, social feed |

In the cloud, partitions are **rare**, but **latency** and **partial failure** are daily.

---

## Strong vs eventual

| Strong (within one svc) | Eventual (between svcs) |
|--------------------------------|----------------------|
| a local Postgres TX | saga + outbox |
| read-your-writes in one DB | projection lag |
| FK inside the service | no FK cross-service |

---

## Consistency patterns

| Pattern | Description |
|---------|----------|
| **Read-your-writes** | after a POST the user sees their write (route to primary / sticky) |
| **Monotonic reads** | don't "roll back" in time |
| **Causal** | related events in order |
| **Session consistency** | tied to the user session |

For checkout: **strong** inside the Payment svc; **eventual** to the Warehouse — OK with a "processing" UX.

---

## Compensation vs prevention

| | Prevention | Compensation |
|--|------------|--------------|
| Idea | don't allow inconsistency | fix it afterward |
| Example | reserve before pay | refund if double charge |

Saga is compensation ([09-saga-patterns](09-saga-patterns.md)).

---

## Distributed lock (carefully)

A Redis/DB lock between services is **fragile** (TTL, fencing). Prefer:

- idempotency
- a unique business key
- a saga state machine

---

## Testing consistency

| Test | What it catches |
|------|-----------|
| Chaos: kill consumer | lag, duplicate |
| Parallel place order, same sku | oversell |
| Network delay | stale read |

---

## In mock-exams

| Topic | Course |
|------|------|
| Postgres MVCC | [postgresql-basic](../postgresql-basic/README.md) |
| Redis consistency | [redis-intermediate](../redis-intermediate/README.md) |
| Messaging guarantees | [messaging-deep/02](../messaging-deep/02-delivery-guarantees.md) |

---

## Subtasks

**Time:** ~55–65 min.

### 12.1 Consistency map (20 min)

Table: service pair (A→B) | strong/eventual | max lag | user-visible symptom |

### 12.2 CAP for 3 stores (15 min)

Order DB, Redis cache, Search index — for each, CP/AP and why.

### 12.3 Oversell scenario (15 min)

Two parallel orders for the last SKU — which mechanism (reserve, optimistic lock, saga)? Sequence diagram.

### 12.4 Read-your-writes (10 min)

The order list after `POST /orders` — how do you guarantee it for the user (no magic)?

### 12.5 Acceptable inconsistency (5 min)

One "acceptable" inconsistency with a stakeholder's business sign-off.

---

## Summary

A distributed system **chooses** where to be strong and where to be eventual. Document lag and oversell scenarios; don't promise ACID globally.

---

## Checklist

- [ ] Consistency map filled in?
- [ ] Oversell mitigated?
- [ ] No unnecessary distributed locks?

**Next:** [13. Resilience patterns](13-resilience-patterns.md).
