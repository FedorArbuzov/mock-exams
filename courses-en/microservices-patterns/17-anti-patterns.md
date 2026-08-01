# 17. Anti-patterns: distributed monolith and others

## Intro

Microservices on paper, a monolith in pain — the **distributed monolith**. This chapter is a catalog of anti-patterns with **symptoms** and **cures**.

---

## Distributed monolith

| Symptom | Cure |
|---------|---------|
| All svcs deploy together | boundaries, contracts, CI split |
| Shared database | [08-database-per-service](08-database-per-service.md) |
| A synchronous chain of 6+ hops | async, BFF, re-boundary |
| A shared `lib-domain` | ACL, duplicate DTO |

---

## Nanoservices

A 200-line service "because micro":

| − | |
|---|---|
| ops overhead | network > compute |
| no owner | |

**Rule:** a service should **carry the meaning** of a bounded context, not "one endpoint."

---

## God service / ESB

An "integration service" knows all the models and routes everything — a **monolith again**, but with XML.

Cure: events + ACL; integration is a thin adapter.

---

## Chatty API

20 HTTP calls for one screen without a BFF — latency and fragility.

Cure: [07-gateway-bff-mesh](07-gateway-bff-mesh.md), GraphQL carefully.

---

## Distributed transactions (2PC)

XA in production between Postgres and Kafka — **avoid**.

Cure: saga + outbox.

---

## Retry on POST storm

Without idempotency — duplicate orders.

Cure: [08-idempotency](../api-design/08-idempotency-retries.md), [09-saga](09-saga-patterns.md).

---

## Logging without correlation

"Error in payment" × 50 pods — impossible to correlate.

Cure: [14-distributed-observability](14-distributed-observability.md).

---

## Premature microservices

A 5-person startup, 15 services, 0 users.

Cure: [01-monolith-vs-microservices](01-monolith-vs-microservices.md) — a modular monolith.

---

## In mock-exams

| Topic | Course |
|------|------|
| DevOps anti-patterns | [devops-culture/12](../devops-culture/12-anti-patterns.md) |
| Container security | [containers-basic/14](../containers-basic/14-security.md) |

---

## Subtasks

**Time:** ~55–65 min.

### 17.1 Self-assessment (20 min)

For your (or a study) project: score each anti-pattern 0–3 (0=none, 3=critical). Top 3 problems.

### 17.2 Root cause (15 min)

For the top 1: org cause (Conway) + tech cause.

### 17.3 Remediation plan (15 min)

For the top 1: 3 steps for the quarter (not "rewrite everything").

### 17.4 Nanoservice audit (10 min)

Are there svcs with a single endpoint and no owner? A list of merge candidates.

### 17.5 "We're not microservices" (5 min)

When to honestly go back to the "modular monolith" label — criteria for your org.

---

## Summary

Anti-patterns are recognized by **deploy, data, and debugging**, not by the number of Docker containers. The cure is almost always boundaries and simplification.

---

## Checklist

- [ ] Top 3 anti-patterns documented?
- [ ] Remediation realistic?
- [ ] No 2PC in the architecture?

**Next:** [18. Migration playbook](18-migration-playbook.md).
