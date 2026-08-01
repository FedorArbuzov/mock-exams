# 20. Synthesis: Architecture Decision Record

## Final task

Bring together **all the subtasks** from the course into a single **Microservices ADR** for a product ([image-platform](../aws-intermediate/projects/image-platform/), [fastapi/42](../fastapi/42-capstone.md), or your own).

**Time:** ~**3–4 hours**.

---

## Deliverable structure

### 1. Executive summary (½ page)

- Recommendation: **stay modular monolith / hybrid / full microservices**
- 3 key risks
- Horizon: a 12-month roadmap

### 2. Context & drivers (from ch. 01–03)

| Section | Contents |
|--------|------------|
| Decision matrix | weighted scores |
| Bounded contexts | context map |
| Teams | stream/platform, Conway note |

### 3. Target architecture (from ch. 05–08, 13)

```text
[diagram: client → GW/BFF → services → data]
```

| Service | Owner | Store | Public API |
|--------|-------|-------|------------|
| … | … | … | Y/N |

### 4. Communication (ch. 05–07)

| Flow | Sync/async | Contract | Timeout |
|------|------------|----------|---------|
| … | … | … | … |

Event catalog (top 10 events).

### 5. Data & consistency (ch. 08–12)

- Data ownership map
- Saga: orchestration/choreography + compensation table
- Outbox: yes/no, relay type
- CQRS: where the projections are
- Consistency map + acceptable lag

### 6. Resilience & ops (ch. 13–15)

- Resilience policy table (4 dependencies)
- Tracing/logging standard
- Deploy independence checklist
- Canary metrics

### 7. Testing (ch. 16)

- Test pyramid %
- Contract pairs list
- E2E critical 5

### 8. Migration (ch. 04, 17–18)

- Phase 0–4 timeline
- Strangler #1 service
- Anti-patterns acknowledged + remediation

### 9. Rejected alternatives

At least **three**:

| Alternative | Why not |
|-------------|------------|
| Big bang rewrite | … |
| 2PC | … |
| GraphQL everywhere | … |

### 10. Open questions

5 questions for stakeholders with deadlines.

---

## Course master table

| Topic | Chapter |
|------|-------|
| Do we need microservices? | [01](01-monolith-vs-microservices.md) |
| Domain boundaries | [02](02-bounded-context-ddd.md) |
| Teams | [03](03-conway-teams.md) |
| Incremental migration | [04](04-strangler-extraction.md) |
| Sync | [05](05-sync-communication.md) |
| Events | [06](06-async-events.md) |
| GW/BFF/mesh | [07](07-gateway-bff-mesh.md) |
| Data ownership | [08](08-database-per-service.md) |
| Saga | [09](09-saga-patterns.md) |
| Outbox/ES | [10](10-outbox-eventsourcing.md) |
| CQRS | [11](11-cqrs-read-models.md) |
| Consistency | [12](12-consistency-cap.md) |
| Resilience | [13](13-resilience-patterns.md) |
| Observability | [14](14-distributed-observability.md) |
| Deploy | [15](15-deployment-versioning.md) |
| Tests | [16](16-testing-strategy.md) |
| Anti-patterns | [17](17-anti-patterns.md) |
| Playbook | [18](18-migration-playbook.md) |
| Cases | [19](19-system-design-cases.md) |

---

## Course map

```text
01–04   Decision and boundaries
05–08   Communication and data
09–12   Saga, outbox, CQRS, CAP
13–16   Resilience, ops, tests
17–20   Anti-patterns, migration, ADR
```

---

## In mock-exams — practice after the ADR

| ADR item | Course / environment |
|-----------|--------------|
| Implement API + outbox | [fastapi](../fastapi/README.md) + [messaging-deep/10](../messaging-deep/10-outbox-saga.md) |
| Async fan-out | [python-async](../../deploy/python-async/README.md) |
| Celery saga steps | [deploy/celery](../../deploy/celery/README.md) |
| Contract tests | [fastapi/32](../fastapi/32-contract-tests.md) |
| K8s deploy | `mockctl` + [gitops-basic](../gitops-basic/README.md) |
| Tracing | [fastapi/38](../fastapi/38-opentelemetry.md) |

---

## Final subtasks

### 20.1 Draft sections 1–3 (60 min)

Executive + context + target diagram.

### 20.2 Draft sections 4–6 (60 min)

Communication, data, resilience.

### 20.3 Draft sections 7–10 (45 min)

Testing, migration, rejected, questions.

### 20.4 Peer review (30 min)

Checklist: another student/colleague marks 5 weak spots.

### 20.5 Revision (30 min)

Fix the top 3 comments.

---

## Summary

Microservices are a **system of decisions**, not a number of repositories. An ADR records the **why**, the **what**, and the **order**; without it, the team repeats the distributed monolith.

---

## Course checklist

- [ ] All 19 chapters: subtasks done (at least a draft)?
- [ ] ADR's 10 sections filled in?
- [ ] 3 rejected alternatives?
- [ ] Migration phase 0 gate realistic?
- [ ] mock-exams practice planned?

**Course complete.** Next: [messaging-deep](../messaging-deep/README.md), [api-design](../api-design/README.md), [kuber-advanced](../kuber-advanced/README.md), [sre](../sre/README.md).
