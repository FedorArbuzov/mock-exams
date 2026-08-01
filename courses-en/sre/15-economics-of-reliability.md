# 15. The economics of reliability

## Intro: "one more nine — how much does it cost?"

The CTO asks: "Why can't we have **99.99%** like the competitor?" The answer "it's expensive" without numbers is a loss. SRE translates reliability into **expected damage**, the **cost of engineering**, and the **lost profit** from slowing down releases. **Economics** is not Excel for the CFO's sake but an **argument** for a sensible SLO.

---

## Cost of downtime

```text
Cost ≈ (Revenue per hour) × (Duration) × (% users affected)
```

| Factor | Clarification |
|--------|-----------|
| Revenue/hour | peak vs average |
| % affected | only checkout, not the whole site |
| Intangible | brand, support load, SLA penalties |

**Example:** checkout = 50% of revenue, $100k/h total, a 2h outage, 100% of checkout down → **~$100k** direct (simplified).

---

## Cost of a "nine"

Each step in availability is a **nonlinear** growth in cost:

| Tier | Often requires |
|------|----------------|
| 99 → 99.9 | HA, multi-AZ, better monitoring |
| 99.9 → 99.99 | redundancy everywhere, chaos, staff |
| 99.99 → 99.999 | multi-region, custom hardware, org process |

The **marginal cost** of the last nine >> the first.

---

## Cost of speed

| Fast releases | Slow releases |
|----------------|------------------|
| time-to-market | competitors get ahead |
| risk of bugs | fewer change failures |
| spend budget | accumulate release "technical debt" |

The error budget **balances** it ([chapter 04](04-error-budgets.md)).

---

## Risk-adjusted decisions

```text
Expected loss = P(outage) × Cost(outage)
Investment if: Expected loss > Cost(mitigation)
```

Mitigation: canary ($ engineering weeks), multi-AZ ($ infra/mo).

---

## FinOps and SRE

| Practice | Effect |
|----------|--------|
| Rightsizing | -30% waste |
| Spot / reserved | predictable cost |
| Label by team | chargeback |
| Kill idle env | staging cost |

Reliability is **not** "we don't count the money" — it's **deliberate** spend.

---

## When to **lower** the SLO

Sometimes it's **right** to relax the target:

- the service is **not** revenue-critical;
- users **don't** feel the difference between 99.9 vs 99.95;
- the savings → **another** CUJ.

Document the decision — **not** a secret debt.

---

## Conversation with product

| PM's question | SRE's answer |
|-----------|-----------|
| "Why the freeze?" | "Budget 8%, policy" |
| "How much does 99.99% cost?" | "+$X/mo, -Y features/quarter" |
| "Can we go without monitoring?" | "Can't measure the SLA" |

---

## Checklist

- [ ] Is cost/hour computed for tier-1?
- [ ] Is the SLO aligned with revenue impact?
- [ ] Does FinOps see a tag per service?

**Next:** [16. Synthesis and practice](16-synthesis-practice.md).
