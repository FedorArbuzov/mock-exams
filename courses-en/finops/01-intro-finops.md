# 01. FinOps: roles, Inform → Optimize → Operate cycle

## Intro: the bill arrived — who do we blame?

At month end the CFO sees **+$40k** on AWS. DevOps says “it’s EKS,” engineering — “we didn’t change the code,” finance — “who approved the NAT?” Without **FinOps** the conversation turns into a blame hunt. With **FinOps** — into a **measurable cycle**: visibility → optimization → operation with team ownership.

---

## What is FinOps

**FinOps** (Financial Operations) is the practice of jointly managing **cloud cost** across **engineering**, **finance**, and **product**. Not “save at any cost,” but **maximize value** per dollar while keeping delivery speed.

Three driving forces (FinOps Foundation):

| Principle | Meaning |
|---------|--------|
| **Teams need to collaborate** | cost is not FinOps-only |
| **Everyone takes ownership** | teams see **their** bill |
| **Reports should be accessible** | real-time transparency |
| **Decisions are driven by business** | unit economics, not “kill NAT” |

---

## FinOps cycle

```text
Inform    →  Optimize  →  Operate
(see)        (improve)     (sustain)
     ↑___________________________|
```

| Phase | Question | Artifacts |
|------|--------|-----------|
| **Inform** | Who spends how much on what? | tags, dashboards, CUR |
| **Optimize** | Where is waste and commit? | rightsizing, SP, Spot |
| **Operate** | How do we not regress? | budgets, policies, reviews |

---

## Roles

| Role | Focus |
|------|--------|
| **FinOps practitioner** | process, tooling, reports |
| **Engineering** | architecture, autoscaling, labels |
| **Finance / FP&A** | forecast, chargeback, commit planning |
| **Product** | trade-off features vs cost |
| **Leadership** | guardrails, not micromanaging every instance |

In a small team one **platform engineer** may cover 3 roles — you still need the process.

---

## FinOps vs SRE error budget

| | SRE error budget | FinOps budget |
|---|------------------|---------------|
| Resource | **acceptable downtime** | **acceptable spend** |
| Metric | SLI/SLO | $ / unit (request, user) |
| Action when exhausted | freeze releases | review, optimize, cap env |

Related: [sre/15-economics-of-reliability](../sre/15-economics-of-reliability.md) — “one more nine” costs money; FinOps is the **other side** of the same deal.

---

## Common antipatterns

| Antipattern | Why it's bad |
|--------------|--------------|
| Cost cutting without metrics | break prod for −10% |
| Central FinOps without dev buy-in | tags get ignored |
| Monthly review only | leak accumulates for 30 days |
| Blame game by account | people hide resources in another account |

---

## In mock-exams

| Topic | Course |
|------|------|
| Short AWS cost | [aws-advanced/25](../aws-advanced/25-cost-optimization.md) |
| NAT/VPC cost drivers | [networking-deep/06](../networking-deep/06-nat.md), [finops/08](08-storage-network-cost.md) |
| Cardinality cost | [observability-advanced/05](../observability-advanced/05-cardinality-cost.md) |

---

## Summary

FinOps is a **discipline and process**, not a single tool. Engineering owns **80% of the levers** (size, architecture, tags); finance — **forecast and commit**; together — sustainable cloud spend.

---

## Checklist

- [ ] Name the three FinOps phases.
- [ ] How does a cloud cost budget differ from an SRE error budget?
- [ ] Who in your organization “owns” tags?

**Next:** [02. Unit economics](02-unit-economics.md).
