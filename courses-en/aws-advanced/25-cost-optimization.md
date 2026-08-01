# 25. Cost: tags, budgets, Savings Plans

> **Deep dive:** the full FinOps track (unit economics, Kubecost, governance, labs) — [`finops`](../finops/README.md). This lesson is an overview within aws-advanced.

## Cost allocation tags

```hcl
tags = {
  Environment = "prod"
  Team        = "platform"
  CostCenter  = "CC-1234"
}
```

Enable tags in **Cost Explorer** → reports by team/env.

## Budgets

```hcl
resource "aws_budgets_budget" "monthly" {
  name         = "course-monthly"
  budget_type  = "COST"
  limit_amount = "50"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  notification {
    comparison_operator = "GREATER_THAN"
    threshold           = 80
    threshold_type      = "PERCENTAGE"
    notification_type   = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
}
```

## CUR (Cost and Usage Report)

A detailed CSV/Parquet in S3 → Athena → "who spent on NAT".

## Savings Plans / Reserved

| | On-Demand | Savings Plan | Reserved |
|---|---|---|---|
| Flexibility | full | commit $/hour | instance type |
| Discount | 0 | up to ~72% | up to ~72% |

Lambda/S3 — mostly on-demand; EC2/RDS/Fargate — candidates for a commit.

## Practices

- Delete NAT if it isn't needed 24/7
- S3 lifecycle → Glacier
- Rightsize RDS/EKS nodes
- **Idle EKS** — the most common leak in training accounts

## Checklist

- Why a CostCenter tag?
- FORECASTED budget — when does it alert?
- NAT Gateway — why is it expensive?
- CUR vs Cost Explorer?

Next lesson: [26-lab-cost-budgets.md](26-lab-cost-budgets.md). Advanced labs: [finops/13](../finops/13-lab-budgets-tags.md), [finops/14](../finops/14-lab-cost-report.md).
