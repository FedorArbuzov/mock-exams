# 25. Cost: tags, budgets, Savings Plans

> **Углубление:** полный трек FinOps (unit economics, Kubecost, governance, лабы) — [`finops`](../finops/README.md). Этот урок — обзор в рамках aws-advanced.

## Cost allocation tags

```hcl
tags = {
  Environment = "prod"
  Team        = "platform"
  CostCenter  = "CC-1234"
}
```

Включите tags в **Cost Explorer** → отчёты по team/env.

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

Детальный CSV/Parquet в S3 → Athena → «кто потратил на NAT».

## Savings Plans / Reserved

| | On-Demand | Savings Plan | Reserved |
|---|---|---|---|
| Гибкость | полная | commit $/час | instance type |
| Скидка | 0 | до ~72% | до ~72% |

Lambda/S3 — в основном on-demand; EC2/RDS/Fargate — кандидаты на commit.

## Практики

- Удалять NAT если не нужен 24/7
- S3 lifecycle → Glacier
- Rightsize RDS/EKS nodes
- **Idle EKS** — самый частый leak в учебных account

## Чек-лист

- Зачем CostCenter tag?
- FORECASTED budget — когда алерт?
- NAT Gateway — почему дорогой?
- CUR vs Cost Explorer?

Следующий урок: [26-lab-cost-budgets.md](26-lab-cost-budgets.md). Расширенные лабы: [finops/13](../finops/13-lab-budgets-tags.md), [finops/14](../finops/14-lab-cost-report.md).
