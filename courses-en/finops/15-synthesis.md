# 15. Synthesis: cost review and checklist

## Practice task

Run the **first official** FinOps review for:

- a real dev account, or
- a fictional mock-exams platform (image-platform + mockctl + GitLab).

### Deliverables (2–3 hours)

1. **Tag standard** (1 page): required keys, enum, Terraform `default_tags` example.
2. **Budget policy**: $/month limit, FORECASTED 80% + 100% ACTUAL, who gets email.
3. **Showback table** for 3 teams/namespaces (even if numbers are estimates).
4. **Rightsizing backlog** — 5 items with priority (P0 leak vs P2 nice).
5. **K8s allocation** — Kubecost/OpenCost screenshot or namespace $ table.
6. **Quarterly commit recommendation** — buy SP or not, 5 bullets.

---

## Course map

```text
01–02   FinOps + unit economics     →  “why and how to measure value”
03–04   Tags + AWS tools            →  “visibility”
05–08   Rightsizing + K8s + Kubecost + network  →  “where the money is”
09–10   Commit + governance         →  “guardrails”
11–12   Process + observability cost →  “sustain”
13–15   Labs + synthesis            →  “your review”
```

---

## Interview questions

### 1. Showback vs chargeback?

Showback — a report without a real charge; chargeback — P&L impact. Showback is easier to start with.

### 2. FORECASTED budget alert?

Fires when the month’s **forecast** will exceed the threshold — earlier than when the bill closes.

### 3. Why is NAT expensive?

Hourly per-AZ + $/GB processed; HA = 2× hourly; in dev people often leave it 24/7.

### 4. CUR vs Cost Explorer?

Explorer — fast aggregates; CUR — line-level usage for Athena/Kubecost/forensics.

### 5. Kubecost without AWS integration?

Yes — allocation by CPU/RAM requests/usage inside the cluster; cloud costs need a billing hook.

### 6. When Savings Plan?

Stable baseline for 30–60 days, after rightsizing, not for volatile dev.

### 7. FinOps vs “turn off dev at night”?

FinOps is systemic: tags, budgets, process; stopping instances is one tactic.

---

## Maturity checklist

- [ ] Tags activated in Cost allocation
- [ ] FORECASTED budget on every non-prod account
- [ ] Monthly cost review on the calendar
- [ ] Kubecost/OpenCost on a prod-like cluster
- [ ] NAT/endpoints chosen deliberately in the architecture
- [ ] Cleanup checklist after aws-advanced labs
- [ ] Unit cost for the main product known to the PM

---

## In mock-exams — next

| Goal | Course |
|------|------|
| Enterprise + cost gate | [aws-advanced/27](../aws-advanced/27-final-project.md) |
| Reliability economics | [sre/15](../sre/15-economics-of-reliability.md) |
| Network cost | [finops/08](08-storage-network-cost.md), [networking-deep/06](../networking-deep/06-nat.md) |
| Cardinality | [observability-advanced/05](../observability-advanced/05-cardinality-cost.md) |

---

## Summary

The FinOps course is done when you have a **living** cost review document and **3 closed** action items — not when every chapter has been read.
