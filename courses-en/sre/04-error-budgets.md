# 04. Error budget: policy and trade-offs

## Intro: the "features vs stability" war

Product wants a **release by Monday** — "just one flag". SRE says: **three incidents in two weeks**, the burn rate is off the charts. Without a shared language the argument turns into "you're slowing us down" vs "you're breaking things". The **error budget** is a quantitative agreement: at an SLO of 99.9% over 30 days we have **~0.1% "bad" events** to spend — incidents, risky releases, experiments. While the budget lasts, we **speed up**; when it runs out, we **slow down**. This is not a "gut feel" compromise but a **manageable lever**.

---

## Definition of an error budget

```text
Error budget = 1 − SLO target
(as a fraction of "bad" events over the same window as the SLO)
```

| SLO (30d) | Budget (share of bad) | Example: 10M requests/mo |
|-----------|-------------------|---------------------------|
| 99% | 1% | ~100,000 bad |
| 99.9% | 0.1% | ~10,000 bad |
| 99.95% | 0.05% | ~5,000 bad |
| 99.99% | 0.01% | ~1,000 bad |

An **event** is what you defined in the SLI (failed request, slow request, failed job). An inconsistent definition **breaks** the budget.

---

## The budget as a product tool

Google puts it this way: **SRE doesn't "block" releases** — the **exhausted budget** does. The team **itself** chooses:

- to spend the budget on a **canary** of a new cache;
- or to save it for **Black Friday**;
- or to "buy" the risk of a **DB migration**.

```text
         Feature velocity ◄────────────► Reliability work
                    ▲
                    │ error budget
                    ▼
              (measurable remainder)
```

---

## Error budget policy (example)

A 1–2 page document agreed with the PM and engineering manager:

| Budget remaining (30d) | Releases | Engineering |
|----------------------|--------|-----------|
| > 50% | normal process | 20% capacity on toil/reliability |
| 25–50% | canary required, no Friday deploy | grow the reliability backlog |
| 10–25% | only P0/P1 fixes + low-risk | postmortem actions take priority |
| < 10% | feature **freeze** | war room on a new incident |
| 0% (exhausted) | hotfix only | executive review, revisit the SLO? |

**Revisiting the SLO** is a last resort (the business changed), not a way to "win" in Excel.

---

## Burn rate

**Burn rate** — how many times faster than normal the budget is being spent.

```text
burn_rate = (current share of bad) / (share of bad when "exactly at the SLO boundary")
```

If in 1 h you burned as much as is "allowed" over 24 h — burn ≈ **24×**.

| Burn | Intuition |
|------|----------|
| 1× | on the edge |
| 6× | the monthly budget in ~5 days |
| 14.4× | in ~2 days |

Alert on a **high burn** earlier than "fell below SLO for the month" ([chapter 07](07-alerting-on-call.md)).

---

## Two types of budget spending

| Type | Example | Discussion |
|-----|--------|------------|
| **Unplanned** | outage, bad deploy | postmortem |
| **Planned** | risky migration, load test in prod | ticket + rollback plan |

Planned risk is **legitimate** if the policy allows it and there is a **rollback**.

---

## Arguments the budget resolves

| Without budget | With budget |
|------------|----------|
| "Too many incidents" | "We burned 80% in 10 days" |
| "We can't release" | "40% left, canary is ok" |
| "We need a refactor" | "No budget → reliability sprint" |

---

## When the budget "lies"

| Problem | Solution |
|----------|---------|
| SLI doesn't catch real complaints | revise the SLI |
| Low traffic — noise | a longer window or Bayesian approaches |
| Dependency outside the SLO (CDN) | a separate SLO or end-to-end |
| An artificially inflated SLO | an honest target |

---

## Connection to incidents

An incident's **severity** can factor in **how much budget was burned** (not just "is checkout down"). P0 — mass burn; P3 — local degradation.

After an incident: **how much budget is left** → goes into the comms for leadership ([chapter 08](08-incident-management.md)).

---

## Multi-window alerting (practice)

The Google SRE Workbook describes **paging** on a combination of windows — for example, a fast burn over 5m **and** confirmation over 1h, so you're not woken up by a brief spike.

| Window | Burn threshold (example) | Meaning |
|------|---------------------|-------|
| 5m | 14× | "burning right now" |
| 1h | 6× | not a one-off spike |
| 6h | 3× | sustained degradation |

Exact numbers are **calibrated** to your traffic and SLO. The principle matters more: **earlier** than "fell below SLO over 30 days".

---

## Shared ownership of the budget

| Role | Responsibility |
|------|-----------------|
| Product | understands the velocity vs risk trade-off |
| Engineering | doesn't release to zero without agreement |
| SRE | measures, alerts, proposes reliability work |
| Leadership | escalation on exhaustion |

**Weekly SLO review** (30 min): budget remaining, top incidents, 1 action for the week.

---

## In mock-exams

| Material | Course |
|----------|------|
| Error budget lab | [observability-intermediate/08-lab-error-budget](../observability-intermediate/08-lab-error-budget.md) |
| SLO intro | [observability-intermediate/07](../observability-intermediate/07-slo-sli-sla.md) |
| Burn alerts | [chapter 07](07-alerting-on-call.md) |

---

## Interview notes

- The budget formula at 99.9% / 30d.
- What to do when the budget is exhausted?
- Burn rate 14× — what does it mean intuitively?
- Why is the budget not a "penalty on SRE"?

---

## Summary

The error budget converts reliability from morality ("it should be more stable") into **arithmetic**. The team **deliberately** spends the budget on risk; when the reserve runs out, it **slows down** and fixes a class of problems.

---

## Checklist

- [ ] Compute the budget for your SLO and traffic.
- [ ] Do you have a written freeze policy?
- [ ] Alerts on burn, not just "the month is red"?
- [ ] Does the PM know what 20% remaining means?

**Next:** [05. Toil and automation](05-toil-automation.md).
