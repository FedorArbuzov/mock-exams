# 19. System design: case walkthroughs

## Intro

Three typical interview and architecture-review cases — with **subtasks** for a full walkthrough. Use the course's patterns; don't start with "20 microservices."

---

## Case A — E-commerce checkout

**Requirements:** 10k orders/hour peak, payment PCI scope isolated, no inventory oversell, email async.

### Reference architecture

```text
[BFF] → Order (sync create)
     → sync Reserve Inventory (short timeout)
     → sync Authorize Payment
     → async OrderPlaced → Notification, Analytics, Warehouse
```

| Decision | Pattern |
|---------|---------|
| Inventory reserve | sync + local TX or a saga step |
| Payment | a separate svc / PCI boundary |
| Fan-out | outbox + events |
| Read catalog | CQRS/cache |

### Common candidate mistakes

- A sync call to analytics in the checkout path
- A shared `orders` table
- No idempotency on POST /orders

---

## Case B — Upload & process (image-platform)

**Requirements:** upload large files, async processing, notify when done ([image-platform](../aws-intermediate/projects/image-platform/)).

```text
POST /uploads → 202 + upload_id
S3 presigned URL
Event upload.completed → Worker → processing
GET /jobs/{id} or webhook
```

| Decision | Pattern |
|---------|---------|
| Long work | async job ([api-design/11](../api-design/11-async-webhooks.md)) |
| Storage | S3 ([python-aws](../python-aws/README.md)) |
| Queue | SQS / Celery |

Microservices are **optional** — start with a modular monolith + worker.

---

## Case C — Multi-tenant SaaS billing

**Requirements:** tenant isolation, usage metering, monthly invoicing, audit.

| Service | Ownership |
|--------|----------|
| Identity/Tenant | tenant_id claim |
| Usage | append-only events |
| Billing | invoice generation |
| Notification | email |

| Pattern | Application |
|---------|------------|
| DB per tenant (enterprise) or row-level `tenant_id` | cost trade-off |
| Event sourcing usage | audit |
| Saga | invoice + payment fail compensate |

---

## Answer framework (45 min interview)

| Minute | Block |
|--------|------|
| 0–5 | clarifying questions (scale, consistency, clients) |
| 5–15 | high-level diagram + bounded contexts |
| 15–25 | API + data + sync/async |
| 25–35 | failure modes + saga/resilience |
| 35–45 | observability, deploy, evolution |

---

## In mock-exams

| Case | Course |
|------|------|
| FastAPI system design | [fastapi/40](../fastapi/40-system-design.md) |
| Async microservices | [python-async/34](../python-async/34-system-design-async.md) |
| Messaging SD | [messaging-deep/12](../messaging-deep/12-system-design.md) |

---

## Subtasks

**Time:** ~90–120 min (do **one** case fully or **three** briefly).

### 19.A E-commerce (if A is chosen)

| # | Task | Time |
|---|--------|-------|
| A1 | Clarifying questions (≥8) | 10 min |
| A2 | Context map + diagram | 20 min |
| A3 | Sync vs async table | 15 min |
| A4 | Saga failure matrix | 15 min |
| A5 | Observability + SLO | 10 min |
| A6 | "Why not 15 services" | 10 min |

### 19.B Image platform (if B is chosen)

| # | Task | Time |
|---|--------|-------|
| B1 | API endpoints list | 15 min |
| B2 | Job state machine | 15 min |
| B3 | AWS/queue choice ADR | 15 min |
| B4 | Webhook security | 10 min |
| B5 | Monolith vs 2 svcs | 15 min |

### 19.C Billing SaaS (if C is chosen)

| # | Task | Time |
|---|--------|-------|
| C1 | Tenant isolation model | 20 min |
| C2 | Usage event schema | 15 min |
| C3 | Invoice saga | 20 min |
| C4 | Audit / compliance | 10 min |
| C5 | Cost estimate, order of magnitude | 15 min |

---

## Summary

A good design starts with a **monolith/modular** + explicit boundaries; microservices where scale/org demand them. Always: failure, idempotency, observability.

---

## Checklist

- [ ] One case worked through end-to-end?
- [ ] A rejected "sketch 20 svcs"?
- [ ] Failure mode not forgotten?

**Next:** [20. Synthesis: Architecture Decision Record](20-synthesis.md).
