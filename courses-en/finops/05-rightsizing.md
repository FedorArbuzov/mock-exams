# 05. Rightsizing: EC2, RDS, Lambda

## Intro

**Rightsizing** means picking resource type/size for **actual** load with headroom for peaks, without “m5.4xlarge just in case.” Data sources: CloudWatch, Cost Explorer recommendations, **Kubecost** for K8s ([07](07-kubecost.md)).

---

## EC2

| Signal | Action |
|--------|----------|
| CPU < 20% p95 for a week | downgrade instance family/size |
| CPU credit exhaustion (T-class) | Unlimited or fixed size |
| Memory pressure | more RAM, not more CPU |
| Network saturated | enhanced networking, bigger instance |

**Safe resize steps:**

1. Snapshot / backup.
2. Stop → change type → start (or launch new + ASG refresh).
3. Check **burst credits**, **ENA**, **license** (Windows).

**Graviton (ARM):** up to ~20% cheaper with a compatible image — test on stage.

---

## RDS

| Parameter | Rightsizing |
|----------|-------------|
| Instance class | CPU/Memory via Performance Insights |
| Storage | gp3 IOPS/throughput vs overprovisioned io1 |
| Multi-AZ | prod yes, dev no |
| Aurora Serverless v2 | variable load |

**Dev leak:** `db.r6g.xlarge` “same as prod” 24/7 — a separate small instance + auto stop.

---

## Lambda

You pay for **requests + GB-second**:

| Lever | Effect |
|-------|--------|
| Memory | more CPU, less duration — **optimum is not always 128MB** |
| Provisioned concurrency | cost ↑, cold start ↓ |
| Architecture ARM | cheaper |
| VPC attach | +ENI cost/complexity — only if needed |

Power tuning: AWS Lambda Power Tuning (open source) — cost vs memory chart.

---

## Automation

- **AWS Compute Optimizer** — recommendations (enable in the account).
- **Instance Scheduler** — stop dev nights/weekends.
- **ASG** with mixed instances + Spot ([09](09-commitments.md)).

---

## In mock-exams

Rightsizing report — [14-lab-cost-report](14-lab-cost-report.md). After [aws-advanced/14 EKS lab](../aws-advanced/14-lab-eks.md) — check node group size.

---

## Summary

Rightsizing is **not a one-off audit**, but a quarterly ritual. EC2/RDS — by metrics; Lambda — by the duration/memory curve.

---

## Checklist

- [ ] Can you tell underutilized CPU from “need headroom for Black Friday”?
- [ ] Is dev RDS sized separately from prod?
- [ ] Has Lambda memory been tested, not left at default 128MB?

**Next:** [06. EKS and Kubernetes cost](06-kubernetes-cost.md).
