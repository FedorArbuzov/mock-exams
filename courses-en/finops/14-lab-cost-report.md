# 14. Lab: report and rightsizing plan

## Goal

Build a **monthly cost review** artifact: spend table, rightsizing recommendations, action items. Time: **90–120 minutes**.

---

## Option A — real AWS dev account (recommended)

### Step 1. Cost Explorer

Console → **Cost Explorer** → Last 7/30 days → Group by **Service**.

Record the top 5:

| Service | $ | % total | Note |
|---------|---|---------|------------|
| Amazon EC2 | | | |
| Amazon VPC (NAT) | | | |
| Amazon EKS | | | |
| … | | | |

### Step 2. Group by tag

Filter `Environment=dev` (or your tag) → Group by **Team** / **Service**.

Find **Unlabeled** / missing tags — % of total.

### Step 3. Rightsizing

**Compute Optimizer** or Cost Explorer → Recommendations:

| Resource ID | Current | Recommended | Est. savings/mo |
|-------------|---------|-------------|-----------------|
| i-xxx | m5.xlarge | m5.large | $ |

If there are no recommendations — manually: an instance with CPU < 20% p95.

### Step 4. Kubernetes (if you have EKS)

Install [Kubecost](07-kubecost.md) or OpenCost → Allocation by namespace → top 3.

### Step 5. NAT / transfer

Separate line: **NAT Gateway** hours + **Data Transfer** — from CUR or Explorer drill-down.

---

## Option B — practice template (no AWS)

Fill the table **hypothetically** for the [image-platform](../aws-intermediate/projects/image-platform/) architecture:

| Component | Est. $/mo | Optimization |
|-----------|-------------|-------------|
| NAT GW 2 AZ | ~$70+ | 1 NAT in dev, endpoints |
| EKS control plane | ~$73 | destroy after lab |
| 3× m5.large nodes | ~$280 | Spot for dev, smaller type |
| RDS db.t3.medium | ~$50 | stop nights |
| ALB | ~$20 | shared ALB |
| S3 + transfer | ~$5 | lifecycle |

---

## Deliverable: one-page Cost Review

```markdown
# Cost Review — YYYY-MM

## Summary
- Total: $X (budget $Y, forecast $Z)
- Biggest delta: NAT +$40 (new EKS lab)

## Actions
| # | Action | Owner | Savings est. | Due |
|---|--------|-------|--------------|-----|
| 1 | Destroy EKS lab cluster | me | $400/mo | Fri |
| 2 | S3 lifecycle on logs bucket | platform | $10/mo | next sprint |
| 3 | Rightsize RDS dev | DBA | $25/mo | Wed |

## Unit cost (if applicable)
- $ / 1000 API requests = $0.0X (assumption: N requests)
```

---

## Success criteria

- [ ] Top-5 services with numbers or justified estimates
- [ ] At least 3 action items with owner and ETA
- [ ] NAT and tags/unallocated mentioned
- [ ] (A) Explorer screenshot or (B) link to the architecture

---

## Cleanup checklist

After EKS/VPC labs:

- [ ] `terraform destroy` / `eksctl delete cluster`
- [ ] Orphan EBS volumes
- [ ] Elastic IPs unattached
- [ ] Old snapshots > 30d (dev)

**Next:** [15. Synthesis](15-synthesis.md).
