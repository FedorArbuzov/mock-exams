# 05. Conway's law and architecture

## Intro

1968 — Melvin Conway: **organizations design systems that copy their communication structure**. A monolith with 80 developers in one open space — one deployable. Three silos “frontend / backend / DBA” — three layers with **rigid** APIs and slow change.

---

## Formulation for engineers

```text
Architecture ≈ f(who talks to whom every day)
```

**Technology** does not primarily dictate boundaries — **social structure** does. Then boundaries **cement** in code.

---

## Examples

| Organization | Typical system |
|-------------|------------------|
| 4 teams by layer (UI, API, DB, ops) | 3-tier, shared DB, “API gateway as a wall” |
| 6 teams by product feature | 6 services (or 6 modules) |
| 1 platform + 8 squads | shared K8s, different namespaces / repos |
| Outsourced QA separate | “throw over the wall,” long release |

---

## Link to microservices

Microservices **work** when:

- **teams** are autonomous (own the service + data or a clear contract);
- **interfaces** are stable;
- **operational** maturity exists (observability, [sre](../sre/README.md)).

Microservices **break** when:

- one team for 40 services;
- distributed monolith — always a joint deploy;
- no platform — every squad stands up its own Kafka.

---

## Communication paths

The **more** people must approve a change, the **higher** the latency and the **fewer** the experiments.

```text
Squad A ──► Squad B ──► Ops ──► Security ──► Prod
         (4 handoffs = lead time explodes)
```

---

## In mock-exams

Architecture of [image-platform](../aws-intermediate/projects/image-platform/) — discuss: how many **teams** are needed to run VPC + Lambda + RDS + EKS.

---

## Summary

Conway is not a “myth,” it's **diagnostics**. Debating architecture without an org chart is half a conversation.

---

## Checklist

- [ ] Draw the org chart next to the service map. Do they look alike?
- [ ] How many handoffs to prod for one feature flag?
- [ ] Is there a “shared DB for everyone” as a symptom of a silo data team?

**Next:** [06. Reverse Conway](06-reverse-conway.md).
