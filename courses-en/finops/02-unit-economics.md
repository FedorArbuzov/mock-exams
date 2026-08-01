# 02. Unit economics, showback and chargeback

## Intro

“AWS grew 30%” is a bad headline. “**Cost per order** grew 5% because of a NAT spike” is a decision for product and platform. **Unit economics** translates infrastructure into business language.

---

## Unit cost

```text
Unit cost = Total cloud cost (allocated) / Business unit
```

Example **units**:

| Product | Unit |
|---------|------|
| E-commerce | $ / order, $ / 1000 checkouts |
| SaaS API | $ / 1M requests |
| Data platform | $ / TB processed |
| Internal platform | $ / developer / month |

Without a unit, finance sees only the **aggregate**; engineering doesn’t see the **effect** of optimization.

---

## Showback vs chargeback

| | Showback | Chargeback |
|---|----------|------------|
| Bill to the team | report “as if you paid” | real P&L charge |
| Motivation | transparency | stronger |
| Complexity | lower | needs a finance process |

**Showback** is a good start for mock-exams and training accounts: teams **see** the number without accounting overhead.

---

## Allocation without perfect tags

1. **Direct** tags — EC2 with `Team=checkout`.
2. **Proportion** — shared ALB split by % of traffic (metrics).
3. **Amortized** — Support plan, Organizations fee — by headcount.

The **unallocated** share should **shrink** (<5–10% goal).

---

## Marginal cost of a release

New feature → new resources:

| Design review question |
|------------------------|
| +how many $/month at 10k RPS? |
| Do we need always-on NAT or a VPC endpoint? |
| Will a cache cut RDS by X%? |

Related to [sre/14-production-readiness](../sre/14-production-readiness.md) — a PRR can include a **cost estimate**.

---

## In mock-exams

Training [image-platform](../aws-intermediate/projects/image-platform/) — compute the unit “$ / 1000 uploads” after the labs (template in [14-lab-cost-report](14-lab-cost-report.md)).

---

## Summary

FinOps maturity = from **“how much total”** to **“how much per unit of value.”** Showback teaches teams; chargeback locks in ownership.

---

## Checklist

- [ ] Pick a unit for your main service.
- [ ] Estimate % unallocated cost today.
- [ ] One shared resource — how would you split it?

**Next:** [03. Tags and allocation](03-tagging-allocation.md).
