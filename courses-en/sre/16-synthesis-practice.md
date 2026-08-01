# 16. Synthesis: practice, interviews, checklist

## Why a final chapter

Sixteen chapters — a lot of concepts. This chapter **pulls** them into **one working artifact** and gives guidance for **interviews** and **self-assessment** of maturity. Without practice on **your** (or a training) service, the theory stays abstract.

---

## Practical task: the SLO document

Choose a service:

- a real one at work (without secrets in a public fork), or
- a training one: checkout from [aws-intermediate image-platform](../aws-intermediate/projects/image-platform/), the demo-app from [deploy/observability](../../deploy/observability/README.md), hello-gitops from [deploy/gitops](../../deploy/gitops/README.md).

### Deliverables (2–4 hours)

1. **One-page SLO doc** ([template from chapter 03](03-sli-slo-sla.md)):
   - owners, CUJ, 2 SLIs, targets 30d, definition of bad events.
2. **Error budget policy** ([chapter 04](04-error-budgets.md)) — a table of freeze thresholds.
3. **One burn-rate alert** (a description in words or YAML from [observability-intermediate](../observability-intermediate/07-slo-sli-sla.md)).
4. **Postmortem outline** for a tabletop P0 ([chapter 09](09-postmortems.md)) — a 6-line timeline + 3 actions.
5. **PRR**: a 10-item checklist — mark ✅/❌ for the chosen service ([chapter 14](14-production-readiness.md)).

### Self-check criteria

| # | Criterion |
|---|----------|
| 1 | SLI is user-centric, not CPU |
| 2 | SLO is justified (not a copied 99.9) |
| 3 | Policy is agreeable with the PM "on paper" |
| 4 | Postmortem is blameless |
| 5 | There's a link to a mock-exams course for metrics practice |

---

## Course map (recap)

```text
01–04  Measurement and budget   →  "how much can we break"
05     Toil                     →  "time for engineering"
06–07  Observe + alert          →  "how to find out and wake up"
08–09  Incident + learn         →  "how to respond and learn"
10–12  Capacity, change, DR     →  "how not to die from growth and disaster"
13–15  Org, launch, money       →  "how to embed it into the business"
16     Synthesis                →  "your SLO doc"
```

---

## Interview questions (detailed answers)

### 1. How does SRE differ from DevOps?

**Short:** DevOps is culture and delivery; SRE is a **practice with SLO/error budget**.
**In full:** DevOps doesn't set a numeric trade-off; SRE **measures** unreliability and uses **policy** to slow releases when the budget is spent. You can be DevOps without SRE; SRE without automation is pain.

### 2. How to choose SLO 99.9 vs 99.95?

Look at **user pain**, the **cost of downtime**, the **cost of the next nine**. If the difference isn't felt by the user — 99.95 is **expensive** for nothing. Document your assumptions.

### 3. The error budget is exhausted — what do you do?

Freeze features, a reliability sprint, prioritize postmortem actions, executive visibility. **Not** "quietly raise the SLO".

### 4. Describe an incident where you were IC

STAR structure: Situation, Task (roles), Action (mitigate first), Result (MTTR, postmortem). If you weren't an IC — a tabletop.

### 5. An example of a good and a bad SLI

Bad: CPU. Good: the share of successful checkouts over 5m. Why — [chapter 03](03-sli-slo-sla.md).

### 6. Burn rate

The speed of budget consumption relative to "exactly at the SLO boundary". We alert early — [chapter 04](04-error-budgets.md), [07](07-alerting-on-call.md).

### 7. Blameless postmortem

Not "without accountability" but **systemic** actions instead of punishment. An example of the language — [chapter 09](09-postmortems.md).

### 8. RTO vs RPO

RPO — data; RTO — the time to restore the service — [chapter 12](12-disaster-recovery.md).

---

## SRE maturity checklist (personal)

| Practice | Yes/No |
|----------|--------|
| There's an SLO on the main CUJ | |
| Burn alerts | |
| Postmortem < 72h for P0/P1 | |
| On-call runbook | |
| Load test before the peak | |
| GitOps / controlled change | |
| DR drill < 12 months | |
| Toil is tracked | |

**8/8** — rare; **4+** — a healthy direction.

---

## Where to go after the course

| Goal | mock-exams course |
|------|-----------------|
| Metrics hands-on | [observability-intermediate](../observability-intermediate/README.md) |
| K8s production | [kuber-advanced](../kuber-advanced/README.md) |
| GitOps | [gitops-intermediate](../gitops-intermediate/README.md) |
| Security | [secrets-advanced](../secrets-advanced/README.md) |
| Mock CKA/CKS | [mock-ckad](../mock-ckad/README.md) |

---

## Summary of the whole course

SRE is **managing reliability as engineering**: measure (SLI/SLO), agree (budget), find out (observability), respond (incident), learn (postmortem), prevent (capacity, change, DR), embed it into the organization and the **economics**. You don't have to remember all the tables — you must be able to **write an SLO doc** and **hold** a conversation with product in its language.

---

## Closing

Save the SLO doc in the team repository (or in your personal notes). Reread it in a **quarter** — a living document or a dead template?

**Course complete.** Questions and improvements — via the mock-exams repository issues.
