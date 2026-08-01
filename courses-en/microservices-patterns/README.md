# Microservices Patterns

A theory course on **"how to design and evolve a distributed system"**: when to split a monolith, **bounded context**, sync/async, **saga**, **outbox/CQRS**, resilience, observability, testing, and migration. A "book"-style format with **subtasks** in each chapter; **no new environment** — hands-on happens in the existing courses and `deploy/*`.

**Who it's for:** backend / platform / tech lead; architects preparing for **system design**, a monolith refactor, or an interview.

**Prerequisites (at least two):**

| Course | Why |
|------|--------|
| [containers-basic](../containers-basic/README.md) | images, networking, deploy unit |
| [messaging-deep](../messaging-deep/README.md) | queues, guarantees, outbox (intro) |
| [api-design](../api-design/README.md) | HTTP contracts, BFF, API boundaries |

**Helpful:** [kuber-intermediate](../kuber-intermediate/README.md), [observability-intermediate](../observability-intermediate/README.md), [devops-culture/05–08](../devops-culture/05-conway-law.md), [python-celery](../python-celery/README.md), [fastapi/40](../fastapi/40-system-design.md).

## How to read

- Chapters **01–18** — ~**45–60 min** (theory + **subtasks**).
- Chapters **19–20** — case studies and the **final ADR** (**3–4 h**).
- The **"In mock-exams"** block — practice in other courses.
- At the end of each chapter — a **checklist**; don't move on until the subtasks are done (at least in draft).

**Time:** ~**20–28 hours**.

## Curriculum

### Part I — When and how to split (01–04)

| # | Chapter |
|---|--------|
| 01 | [Monolith vs microservices: decision framework](01-monolith-vs-microservices.md) |
| 02 | [Bounded context and domain decomposition](02-bounded-context-ddd.md) |
| 03 | [Conway and team topology](03-conway-teams.md) |
| 04 | [Strangler Fig and incremental extraction](04-strangler-extraction.md) |

### Part II — Communication (05–08)

| # | Chapter |
|---|--------|
| 05 | [Synchronous communication: REST, gRPC, contracts](05-sync-communication.md) |
| 06 | [Asynchrony and event-driven architecture](06-async-events.md) |
| 07 | [API Gateway, BFF, and service mesh (overview)](07-gateway-bff-mesh.md) |
| 08 | [Database per service and data ownership](08-database-per-service.md) |

### Part III — Data and consistency (09–12)

| # | Chapter |
|---|--------|
| 09 | [Saga: orchestration and choreography](09-saga-patterns.md) |
| 10 | [Outbox, inbox, and event sourcing](10-outbox-eventsourcing.md) |
| 11 | [CQRS and read models](11-cqrs-read-models.md) |
| 12 | [CAP, eventual consistency, and trade-offs](12-consistency-cap.md) |

### Part IV — Resilience and operations (13–16)

| # | Chapter |
|---|--------|
| 13 | [Resilience: timeout, retry, circuit breaker, bulkhead](13-resilience-patterns.md) |
| 14 | [Observability in a distributed system](14-distributed-observability.md) |
| 15 | [Independent deploy, versions, and feature flags](15-deployment-versioning.md) |
| 16 | [Microservices testing strategy](16-testing-strategy.md) |

### Part V — Anti-patterns and migration (17–18)

| # | Chapter |
|---|--------|
| 17 | [Anti-patterns: distributed monolith and others](17-anti-patterns.md) |
| 18 | [Monolith migration playbook](18-migration-playbook.md) |

### Part VI — Synthesis (19–20)

| # | Chapter |
|---|--------|
| 19 | [System design: case walkthroughs](19-system-design-cases.md) |
| 20 | [Synthesis: Architecture Decision Record](20-synthesis.md) |

## Environments (optional)

| Pattern | Practice |
|---------|----------|
| HTTP + several services | [deploy/python-async](../../deploy/python-async/README.md), [python-async/18](../python-async/18-lab-parallel-fetch.md) |
| Queues / saga / outbox | [deploy/celery](../../deploy/celery/README.md), [deploy/kafka](../../deploy/kafka/README.md), [messaging-deep/10](../messaging-deep/10-outbox-saga.md) |
| K8s deploy | `mockctl` + [kuber-intermediate](../kuber-intermediate/README.md) |
| Tracing | [observability-advanced](../observability-advanced/README.md), [fastapi/38](../fastapi/38-opentelemetry.md) |
| Contract tests | [fastapi/32](../fastapi/32-contract-tests.md), [python-testing](../python-testing/README.md) |

## What you should end up with

- Justify **whether** microservices are needed for the product (and when to go back to a monolith).
- Draw **bounded contexts**, sync/async boundaries, and the **data owner**.
- Design a **saga** with compensations and an **outbox** for critical events.
- Build in **timeout/retry/CB** and **distributed tracing**.
- Write an **ADR** on "splitting the Order Platform" with migration phases.

## Related courses

| Course | Overlap |
|------|-------------|
| [messaging-deep](../messaging-deep/README.md) | brokers, DLQ, outbox (deeper transport) |
| [api-design](../api-design/README.md) | public contract, BFF, versioning |
| [devops-culture](../devops-culture/README.md) | Conway, Team Topologies |
| [sre](../sre/README.md) | SLO, incidents, error budget |
