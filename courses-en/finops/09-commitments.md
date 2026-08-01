# 09. Savings Plans, Reserved, Spot

## Intro

**On-Demand** — maximum flexibility, maximum price. With **predictable** baseline load, a commit gives up to **~72%** discount — but an **obligation** for 1–3 years.

Overview: [aws-advanced/25](../aws-advanced/25-cost-optimization.md).

---

## Model comparison

| Model | Flexibility | Discount | Risk |
|--------|----------|--------|------|
| On-Demand | full | 0 | none |
| **Compute Savings Plan** | any region/instance family (EC2, Fargate, Lambda) | high | hourly commit $ |
| EC2 Instance Savings Plan | tied to family (e.g. M5) | higher than compute SP | less flexibility |
| Standard RI | instance type + AZ | high | low utilization = waste |
| Convertible RI | exchange type | medium | complexity |
| Spot | 2 min interruption notice | up to ~90% | fault-tolerant only |

---

## Savings Plans — how to think

```text
Commit: $10/hour for 1 year
→ discount applies to eligible usage up to $10/h
→ above commit — on-demand rates
```

**Coverage report** in Cost Explorer: % of on-demand covered. Aim for **70–90%** coverage of the stable base, not 100% (leave on-demand for spikes).

---

## Spot in EKS / ASG

- **Spot node group** + **on-demand baseline** for system/critical.
- **Pod disruption budgets** — graceful drain.
- Diversification of instance types — less capacity crunch.

---

## Lambda / S3 / DynamoDB

- Lambda — **Compute SP** can cover it; often on-demand is simpler at the start.
- S3 — no RI; Intelligent-Tiering, lifecycle.
- DynamoDB — **Reserved capacity** at steady RCU/WCU.

---

## Purchasing process

1. **30–60 days** on-demand baseline in CUR.
2. Exclude **dev/sandbox** from commit.
3. Finance approves $/hour commit.
4. Quarterly **utilization review**.

---

## Summary

Commit — for the **stable** layer; Spot — for **batch/stateless**; on-demand — spikes and experiments. Don’t buy SP before the architecture stabilizes after a migration.

---

## Checklist

- [ ] Do you know current SP/RI coverage %?
- [ ] Spot only for workloads with interruption tolerance?
- [ ] Dev account excluded from a 3-year commit?

**Next:** [10. Governance](10-governance.md).
