# 04. DORA capabilities and measurement traps

## Intro

Metrics are a **consequence**. Accelerate / DORA research describes **capabilities** (organizational abilities) that **correlate** with the four metrics. Pushing “more deploys” without capabilities is gamification.

---

## Key capabilities (simplified)

| Capability | Practices |
|------------|----------|
| **Version control** | everything in Git, infra as code |
| **CI** | auto-tests on every commit |
| **CD** | deploy on button/merge, not manual SSH |
| **Trunk-based development** | short-lived branches |
| **Test automation** | test pyramid, not only e2e |
| **Loosely coupled architecture** | independent deploy units |
| **Empowered teams** | squad owns the service end-to-end |
| **Monitoring** | observability, not only ping |
| **Proactive notification** | alerts on SLO, not on CPU |
| **Healthy culture** | trust, learning ([chapter 11](11-trust-and-incidents.md)) |

In mock-exams: [aws-terraform](../aws-terraform/README.md), [gitlab-advanced](../gitlab-advanced/README.md) SAST, [gitops](../gitops-basic/README.md).

---

## Measurement traps

| Trap | Why it's bad |
|---------|--------------|
| Deploy = “kubectl apply” with no traffic | inflated frequency |
| Ignoring rollbacks | CFR understated |
| Average lead time without percentiles | p50=1d, p95=30d |
| Comparing different products with one number | different risk profiles |
| KPI on a team without autonomy | toxic race |

Use **p50 / p95** for lead time and restore time.

---

## Trunk-based vs GitFlow

| | Trunk-based | Long-lived branches |
|---|-------------|---------------------|
| Lead time | shorter | merge hell |
| Fits | SaaS, K8s | rare embedded releases |
| CI load | steady | spikes before release |

[gitlab-basic](../gitlab-basic/README.md) MR — closer to trunk with **short** branches.

---

## Architectural coupling

**Tightly coupled** systems → one deploy of “everything,” high CFR on any change.

**Loosely coupled** (microservices **or** a modular monolith with clear boundaries) → independent metrics per squad.

Conway ([chapter 05](05-conway-law.md)) explains why “split into 50 microservices with one team” doesn't work.

---

## Summary

Improve **capabilities**; metrics will follow. Gamifying DORA without architecture and tests is theater.

---

## Checklist

- [ ] Do you have CD, or a “manual last step”?
- [ ] What was p95 lead time last quarter?
- [ ] One team for how many deployable units?

**Next:** [05. Conway's law](05-conway-law.md).
