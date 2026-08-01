# 03. Tags, allocation, Cost Categories

## Intro

Without tags, Cost Explorer shows **Amazon EC2** — $12k. With tags — **Team=payments** — $4k, of which **Environment=dev** — $1.2k “can be squeezed.” Tags are the **minimum** FinOps investment.

Baseline in [aws-advanced/25](../aws-advanced/25-cost-optimization.md); here — **strategy and governance**.

---

## Required tag set

| Tag | Example | Why |
|-----|--------|-------|
| `Environment` | prod, stage, dev | separate prod from sandboxes |
| `Team` / `Owner` | platform, checkout | chargeback |
| `Service` | image-api | unit cost |
| `CostCenter` | CC-1234 | finance ERP |
| `ManagedBy` | terraform | don’t touch by hand |

**Convention:** lowercase keys, enum values (`prod` not `Prod-PROD`).

---

## Terraform: shared tags module

```hcl
locals {
  default_tags = {
    Environment = var.environment
    Team        = var.team
    Service     = var.service_name
    CostCenter  = var.cost_center
    ManagedBy   = "terraform"
  }
}

provider "aws" {
  default_tags {
    tags = local.default_tags
  }
}
```

`default_tags` (AWS provider ≥ 3.0) — fewer forgotten resources.

---

## Cost allocation tags

In AWS Console: **Billing → Cost allocation tags** → Activate user-defined tags. Without activation the tag **won’t appear** in reports (delay up to 24h).

---

## Cost Categories

Grouping **without** a tag on every resource:

- by **account** (prod vs sandbox)
- by **service** (all `Amazon RDS`)
- rules: `Environment = dev` OR account id = sandbox

Useful for **legacy** resources before tags were introduced.

---

## Tag Policies (Organizations)

```json
{
  "tags": {
    "Environment": {
      "tag_key": { "@@assign": "Environment" },
      "tag_value": {
        "@@assign": ["dev", "stage", "prod"]
      },
      "enforced_for": { "@@assign": ["ec2:instance", "rds:db"] }
    }
  }
}
```

+ **SCP** “deny creating EC2 without a tag” (optional, strict).

See [aws-advanced/03](../aws-advanced/03-scp-governance.md).

---

## Kubernetes labels → cost

A pod without labels = a **blind spot** in Kubecost. Minimum:

```yaml
metadata:
  labels:
    app: checkout-api
    team: payments
    env: prod
```

Related: [07-kubecost](07-kubecost.md).

---

## Antipatterns

| Problem | Solution |
|----------|---------|
| 47 variants of `env` | enum + policy |
| Tags only on EC2 | default_tags on all services |
| `Name=temp-test` | lifecycle + budget on the dev account |

---

## In mock-exams

Lab: [13-lab-budgets-tags](13-lab-budgets-tags.md). Project: [image-platform](../aws-intermediate/projects/image-platform/) — add `default_tags`.

---

## Summary

Tags are the **API between engineering and finance**. Cost Categories and policies finish the discipline. K8s without labels duplicates the problem in the overlay.

---

## Checklist

- [ ] Is the required tag list agreed with finance?
- [ ] Is Cost allocation activation enabled?
- [ ] Does the Terraform module disallow an empty `Team`?

**Next:** [04. Cost Explorer, CUR, Budgets](04-aws-cost-tools.md).
