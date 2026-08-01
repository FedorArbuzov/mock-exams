# 11. FinOps in process: rituals and culture

## Intro

Tools without a **ritual** produce a dashboard nobody opens. FinOps matures through **regular** cost reviews and **built-in** gates in the engineering flow.

---

## Cadence

| Rhythm | Participants | Artifact |
|------|-----------|---------|
| Weekly (15 min) | platform + leads | top anomalies, leaks |
| Monthly (60 min) | eng + finance + product | cost review deck |
| Quarterly | leadership | commit strategy, unit cost trends |
| Per launch | PRR | cost estimate ([sre/14](../sre/14-production-readiness.md)) |

---

## Monthly cost review agenda

1. **Total vs budget** — forecast month-end.
2. **Top 5 services** — delta vs last month.
3. **Top 3 tag owners** — who grew?
4. **Rightsizing actions** — owner + ETA.
5. **Commit utilization** — SP/RI coverage.
6. **Wins** — what you already saved (morale matters).

---

## Engineering integration

| Gate | Example |
|------|--------|
| Terraform PR | `Infracost` / cost diff comment |
| New service template | default tags + budgets |
| CI destroy | ephemeral env TTL 24h |
| On-call | “cost anomaly” runbook |

**Don’t** block every PR over $5 — focus on **>$X/month** or **>% growth**.

---

## Gamification (carefully)

- Dashboard “team of the month” by **savings** — risk of hiding spend.
- Better: **% allocated tags**, **reduction of idle resources**.

---

## Blameless cost postmortem

Analog of an incident PM: “NAT left after a lab” → action: **cleanup checklist in the MR template**, not “punish the intern.”

---

## Maturity levels (simplified)

| Level | Signs |
|-------|----------|
| Crawl | Explorer sometimes, no tags |
| Walk | tags, budgets, monthly review |
| Run | unit cost, Kubecost, SP, Infracost in CI |
| Fly | chargeback, anomaly automation, product trade-offs |

---

## Summary

FinOps is a **habit**, not a Q4 project. Weekly anomalies + monthly review + PRR cost = a sustainable Operate phase.

---

## Checklist

- [ ] Is there a monthly cost meeting on the calendar?
- [ ] Who owns cleanup of training resources?
- [ ] One recent leak — what process gap?

**Next:** [12. Observability cost](12-observability-platform-cost.md).
