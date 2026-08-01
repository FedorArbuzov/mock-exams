# 13. Lab: budgets, tags, Terraform

## Goal

Apply [chapters 03–04](03-tagging-allocation.md): **default tags**, a **budget** with a FORECASTED alert, verification in Cost Explorer (real AWS) or Terraform validation (LocalStack).

Time: **60–90 minutes**.

Extends [aws-advanced/26-lab-cost-budgets](../aws-advanced/26-lab-cost-budgets.md).

---

## Prerequisites

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
# or AWS dev account with billing + budgets permissions
```

Terraform ≥ 1.5, AWS provider. For email alerts — a real address.

---

## Task 1. `default_tags` module

Create `finops-lab/provider.tf` (or in a fork of `image-platform`):

```hcl
terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

variable "environment" { default = "dev" }
variable "team"        { default = "platform" }
variable "alert_email" { type = string }

provider "aws" {
  region = "eu-central-1"

  default_tags {
    tags = {
      Environment = var.environment
      Team        = var.team
      Service     = "finops-lab"
      CostCenter  = "CC-LAB"
      ManagedBy   = "terraform"
    }
  }
}
```

`terraform apply` a test resource (S3 bucket) → check tags in console/CLI:

```bash
aws s3api get-bucket-tagging --bucket <name>
```

---

## Task 2. Budget

```hcl
resource "aws_budgets_budget" "monthly" {
  name         = "finops-course-monthly"
  budget_type  = "COST"
  limit_amount = "50"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"

  cost_filter {
    name   = "TagKeyValue"
    values = ["User:Team$platform"]
  }

  notification {
    comparison_operator        = "GREATER_THAN"
    threshold                  = 80
    threshold_type             = "PERCENTAGE"
    notification_type          = "FORECASTED"
    subscriber_email_addresses = [var.alert_email]
  }
}
```

**Questions for your notes:**

- How does ACTUAL differ from FORECASTED?
- Why a cost_filter by tag?

---

## Task 3. Cost allocation tag activation

In AWS Console (real account):

**Billing → Cost allocation tags** → Activate `Team`, `Environment`, `Service`.

Wait 24h → Cost Explorer → Group by tag **Team**.

LocalStack: record the steps in the README as “in prod I’ll do this.”

---

## Task 4. Tag policy (optional, Organizations)

Describe a JSON Tag Policy for enum `Environment` ∈ {dev, stage, prod} — applying it in the lab account is optional.

---

## Success criteria

- [ ] Terraform apply with no errors
- [ ] Resource with 5 tags from `default_tags`
- [ ] Budget resource created
- [ ] Notes: FORECASTED vs ACTUAL + screenshot/describe Explorer

---

## Cleanup

```bash
terraform destroy
```

Checklist: [optional-aws-advanced](../aws-advanced/optional-aws-advanced.md).

**Next:** [14. Lab cost report](14-lab-cost-report.md).
