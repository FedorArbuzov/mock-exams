# 01. Monolith vs microservices: decision framework

## Intro

"We need microservices" often means "we want to be Netflix" without knowing the price: **distributed transactions**, debugging by trace id, a versioning matrix, and nightly deploys from five teams. This first chapter is about **when not to split** and which decision criteria to lock down in an ADR.

---

## Definitions

| | Modular monolith | Microservices |
|--|------------------|---------------|
| Deploy | a single artifact | N independent services |
| Process | usually one (or several replicas of one app) | separate process/pod per service |
| DB | one, or schemas in one cluster | **database per service** (the goal) |
| Boundary | modules in code | the network |

**Distributed monolith** — many services, but they deploy together and share a DB; the worst of both worlds ([17-anti-patterns](17-anti-patterns.md)).

---

## When a monolith (or modular monolith) is better

| Signal | Why |
|--------|--------|
| Team < 10–15 engineers | network overhead > the benefit of autonomy |
| Product still searching for PMF | speed of change in one repo |
| Strong ACID transactions everywhere | distributed sagas are harder |
| No mature CI/K8s/observability | ops can't keep up |
| Domain poorly understood | service boundaries will be wrong |

**Modular monolith:** clear packages/apps inside ([django/05](../django/05-apps-structure.md), [fastapi/08](../fastapi/08-project-structure.md)) + the option to extract a module later.

---

## When microservices are justified

| Signal | Why |
|--------|--------|
| Independent release **cadence** per domain | billing once a month, catalog daily |
| Different **scale** (read/write) | catalog 100× traffic vs billing |
| Different **stacks** justified | ML inference vs CRUD |
| Organized into **stream-aligned** teams | [03-conway-teams](03-conway-teams.md) |
| Regulatory **blast radius** | isolating PCI scope |

---

## Decision matrix (template)

Rate 1–5 (1 = poor fit, 5 = excellent):

| Criterion | Monolith | Microservices |
|----------|----------|---------------|
| Time to market right now | | |
| Independent deploy per domain | | |
| Transactional integrity | | |
| Scaling by parts | | |
| Hiring / onboarding | | |
| Observability maturity | | |

The sum doesn't decide automatically — the **weights** depend on the product's stage.

---

## The cost of microservices (explicitly)

```text
+ Team autonomy, fault isolation (with correct boundaries)
− Network: latency, partial failure, versioning
− Data: eventual consistency, duplicated read models
− Ops: tracing, mesh/gateway, N CI pipelines
− Testing: contract + e2e are more expensive
```

---

## In mock-exams

| Topic | Course |
|------|------|
| Django monolith | [django](../django/README.md) |
| Thin FastAPI API | [fastapi](../fastapi/README.md) |
| Comparing stacks | [django/01](../django/01-django-landscape.md) |
| Async fan-out | [python-async/34](../python-async/34-system-design-async.md) |

---

## Subtasks

**Time:** ~45–60 min.

### 1.1 Product context (10 min)

Pick one: [image-platform](../aws-intermediate/projects/image-platform/), [fastapi/42](../fastapi/42-capstone.md), or your own product. Fill in:

| Field | Value |
|------|----------|
| MAU / orders per day (order of magnitude) | |
| Backend team size | |
| Deploys per week | |
| Is there PCI/PII isolation | |

### 1.2 Decision matrix (15 min)

Fill in the table from the section above with **weights** (weights sum to 100%). Compute the weighted score for monolith and microservices.

### 1.3 Arguments "for" and "against" (15 min)

Write **3 bullets** for each side **specifically for your product**, not from Wikipedia.

### 1.4 Recommendation (10 min)

One page: **Modular monolith / Microservices / Wait 6 months** + 2 rejected alternatives.

### 1.5 Risks (10 min)

Table: risk | probability | impact | mitigation (e.g. "no tracing → don't split billing").

---

## Summary

Microservices are an **organizational and ops pattern**, not a way to "write cleaner code." Start with a modular monolith unless there's a clear driver of autonomy or scale.

---

## Checklist

- [ ] Decision matrix filled in with weights?
- [ ] Rejected alternative documented?
- [ ] Observability maturity accounted for?

**Next:** [02. Bounded context and domain decomposition](02-bounded-context-ddd.md).
