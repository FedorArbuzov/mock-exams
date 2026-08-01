# 13. Maturity metrics without vanity

## Intro

“We measure 40 KPIs” — and none of them drives a decision. Maturity is **few** metrics, **tied** to DORA and SLOs, embedded in **rituals**.

---

## Two metric layers

| Layer | Examples | Audience |
|------|---------|-----------|
| **Delivery (DORA)** | frequency, lead time, CFR, MTTR | engineering leadership |
| **Reliability (SRE)** | SLI, error budget burn | product + SRE |
| **Business** | conversion, revenue | product (not platform) |

Don't mix **CPU** with **delivery**.

---

## SPACE (complement to DORA)

GitHub / Nicole Forsgren: **S**atisfaction, **P**erformance, **A**ctivity, **C**ommunication, **E**fficiency — for team **well-being**.

| Why | Example |
|-------|--------|
| burnout before resignation | survey + on-call load |
| don't optimize activity | “1000 commits” ≠ value |

DORA without SPACE → **burnout** at “elite” frequency.

---

## Maturity models (carefully)

CMMI-style “level 3” easily turns into **paperwork**.

| Useful | Harmful |
|---------|--------|
| checklist of capabilities | certification for a checkbox |
| quarterly self-assessment | comparing teams publicly as a ranking |

Use as a **direction**, not a **people ranking**.

---

## Rituals where metrics live

| Ritual | Metrics |
|--------|---------|
| Weekly team | WIP, blocked MR, incidents |
| Monthly eng review | DORA trends, top failures |
| Quarterly | topology review, platform adoption |
| Post-incident | MTTR fact, action closure rate |

[finops/11](../finops/11-process-culture.md) — analog for cost.

---

## Link to observability

| Vanity | Actionable |
|--------|------------|
| dashboard with 200 panels | SLO burn alert |
| “all metrics in Prometheus” | RED on the critical path |
| log everything forever | sampled errors + trace |

[observability-intermediate/07](../observability-intermediate/07-slo-sli-sla.md).

---

## Summary

Measure **little and honestly**. DORA + SLO + periodic SPACE — enough for most orgs of 50–500 engineers.

---

## Checklist

- [ ] How many KPIs are actually looked at in the monthly review?
- [ ] Is there an SLI not tied to a user path?
- [ ] Do activity metrics punish taking vacation?

**Next:** [14. Synthesis](14-synthesis.md).
