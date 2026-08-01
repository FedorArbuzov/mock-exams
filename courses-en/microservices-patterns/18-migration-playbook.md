# 18. Monolith migration playbook

## Intro

A practical **order of operations** from a modular monolith to N services: not theory, but phases, gate criteria, and success metrics. It ties together strangler ([04](04-strangler-extraction.md)), data ([08](08-database-per-service.md)), and ops ([14](14-distributed-observability.md)).

---

## Phase 0 — Prerequisites

| Gate | Criterion |
|------|----------|
| CI/CD | one-click deploy of the monolith |
| Observability | logs + metrics + tracing on the monolith |
| Modular code | apps/packages by bounded context |
| ADR process | decisions are written down |

Without tracing, do **not** cut production.

---

## Phase 1 — Extract a supporting service

The first candidate: **Notification**, **File storage**, **PDF** — few business ties.

| Step | Action |
|-----|----------|
| 1 | Facade route |
| 2 | Async interface (queue) |
| 3 | Cut traffic |
| 4 | Delete the monolith module |

A quick win for the team.

---

## Phase 2 — Extract a read-heavy context

Catalog search, recommendations — **CQRS lite** + a separate read store ([11-cqrs-read-models](11-cqrs-read-models.md)).

Writes stay in the monolith; reads come from the new svc.

---

## Phase 3 — Core domain with saga

Order + Payment + Inventory — **after** gaining outbox/saga experience.

| Step | Action |
|-----|----------|
| 1 | Outbox in the monolith |
| 2 | Consumers in the new svcs |
| 3 | Branch by abstraction |
| 4 | Split the write DB |

The longest phase (quarters).

---

## Phase 4 — Decommission the monolith

| Gate | Criterion |
|------|----------|
| Traffic | <1% on monolith routes |
| Data | no authoritative tables in the monolith DB |
| Team | no "monolith-only" on-call |

Archive the repo; read-only for 3 months.

---

## Rollback at each phase

```text
Feature flag → 100% monolith route
DB: the monolith remains the source of truth until the phase gate
Events: consumers dual or tolerant
```

---

## Migration metrics

| Metric | Why |
|---------|-------|
| % traffic on the new svc | progress |
| Error rate delta | regression |
| p99 checkout | don't degrade |
| Deploy frequency per svc | independence |
| MTTR | ops maturity |

---

## Team ramp

| Role | Action |
|------|----------|
| Stream teams | own the svc |
| Platform | templates, CI, mesh |
| Enabling | contract tests workshop |

[03-conway-teams](03-conway-teams.md).

---

## In mock-exams

| Topic | Course |
|------|------|
| Strangler nginx | [nginx-basic](../nginx-basic/README.md) |
| Celery extract | [python-celery](../python-celery/README.md) |
| GitLab pipeline | [gitlab-intermediate](../gitlab-intermediate/README.md) |

---

## Subtasks

**Time:** ~65–75 min.

### 18.1 Roadmap (25 min)

Gantt (as text): Phase 0–4 with durations in weeks for your product.

### 18.2 First service (15 min)

Which supporting svc goes first? A one-pager extract plan.

### 18.3 Phase 3 risks (15 min)

Top 5 core-split risks + mitigation.

### 18.4 Gate checklist (10 min)

A "we can turn off monolith route X" checklist (10 items).

### 18.5 Stakeholder comms (10 min)

An email template: "why not a big bang, what the business will see."

---

## Summary

Migration takes **many quarters**, in phases with gates, with a simple first svc. The core domain goes last, with outbox and saga readiness.

---

## Checklist

- [ ] Phase 0 gates green?
- [ ] Rollback at each phase?
- [ ] Progress metrics defined?

**Next:** [19. System design: cases](19-system-design-cases.md).
