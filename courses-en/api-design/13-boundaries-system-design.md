# 13. Service boundaries and system design

## Intro

In an interview: "Design a marketplace API." This isn't 5-minute CRUD — it's about **boundaries**, **consistency**, and **contracts** between teams.

---

## Monolith vs microservices (through the API lens)

| | Monolith API | Microservices |
|--|--------------|---------------|
| Boundary | modules inside | the network between |
| Transactions | local ACID | saga / eventual |
| Version | a single deploy | N versions, a compatibility matrix |
| Client | one OpenAPI | BFF or API Gateway aggregation |

Conway's law: [devops-culture/05](../devops-culture/05-conway-law.md).

---

## API Gateway and BFF

```text
Mobile ──► BFF (mobile) ──┬──► Orders Svc
Web    ──► BFF (web)    ──┼──► Catalog Svc
Partner──► API GW (auth) ─┘──► Billing Svc
```

| Layer | Job |
|------|--------|
| **API Gateway** | auth, rate limit, TLS termination, routing |
| **BFF** | aggregation for the UI, fewer round-trips |
| **Service** | a domain contract, not "everything for the frontend" |

Don't drag **chatty** sets of 10 HTTP calls onto a single screen without a BFF.

---

## Service granularity

| Too fine-grained | Too coarse |
|---------------|----------------|
| a separate svc per table | a "God service" with 200 endpoints |
| distributed monolith | can't be deployed independently |

The test: **can a team own the API end to end** and deploy without coordinating with 5 teams?

---

## Sync vs async between services

| | Sync HTTP | Events |
|--|-----------|--------|
| Coupling | high (cascade failure) | lower |
| Consistency | immediate | eventual |
| Debug | easier to trace | harder |

Hybrid: `POST /orders` sync → an `order.created` event for warehouse, email, analytics — [messaging-deep/10](../messaging-deep/10-outbox-saga.md).

---

## API composition patterns

| Pattern | Example |
|---------|--------|
| **Choreography** | services listen to events, no orchestrator |
| **Orchestration** | a saga coordinator invokes the steps |
| **Strangler** | a v1 monolith + v2 new routes on a new svc |

---

## Case study: an order

```text
POST /orders
  → Orders: validate, persist (pending)
  → Payment: authorize (sync) OR payment.requested (async)
  → Inventory: reserve (sync with timeout)
  → 201 { id, status: "pending_payment" }

Events: order.created, payment.captured, order.shipped
```

| Decision | Trade-off |
|---------|-----------|
| Sync inventory reserve | simpler for the client; coupling |
| Async reserve + webhook | a 202 job; harder UX |

Document the order's **state machine** in an OpenAPI `status` enum.

---

## Versions in microservices

```text
Catalog v3 + Orders v1 + Billing v2  →  BFF adapts for a v1 client
```

The client sees **one** version of the public API; the internal chaos is hidden behind the BFF/GW.

---

## Interview checklist

1. Who are the clients (web, partner, internal)?
2. Read vs write ratio?
3. Consistency requirements (money vs catalog)?
4. Idempotency on create?
5. Pagination on lists?
6. Auth (tenant, scopes)?
7. Async for long steps?
8. Events for fan-out?

Related: [messaging-deep/12](../messaging-deep/12-system-design.md), [fastapi/42 capstone](../fastapi/42-capstone.md).

---

## In mock-exams

| Topic | Course |
|------|------|
| Outbox / saga | [messaging-deep/10](../messaging-deep/10-outbox-saga.md) |
| FastAPI capstone | [fastapi/42](../fastapi/42-capstone.md) |
| Django multi-app | [django/05](../django/05-apps-structure.md) |
| API Gateway AWS | [aws-intermediate/05](../aws-intermediate/05-api-gateway.md) |

---

## Summary

API design at the system level is about **boundaries**, **consistency**, and **aggregation**. The public contract is stable; internal services can change behind a BFF.

---

## Checklist

- [ ] Have you drawn client → GW/BFF → services?
- [ ] Sync vs event for each step?
- [ ] Is the state machine documented?

**Next:** [14. Synthesis: API Design Record](14-synthesis.md).
