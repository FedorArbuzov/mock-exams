# 13. Лаба: budgets, tags, Terraform

## Цель

Применить [главы 03–04](03-tagging-allocation.md): **default tags**, **budget** с FORECASTED alert, проверка в Cost Explorer (real AWS) или валидация Terraform (LocalStack).

Время: **60–90 минут**.

Расширяет [aws-advanced/26-lab-cost-budgets](../aws-advanced/26-lab-cost-budgets.md).

---

## Предварительно

```bash
docker compose -f deploy/localstack/docker-compose.yml up -d
# или AWS dev account с правами billing + budgets
```

Terraform ≥ 1.5, AWS provider. Для email alert — реальный адрес.

---

## Задание 1. Модуль `default_tags`

Создайте `finops-lab/provider.tf` (или в fork `image-platform`):

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

`terraform apply` тестового ресурса (S3 bucket) → проверьте теги в console/CLI:

```bash
aws s3api get-bucket-tagging --bucket <name>
```

---

## Задание 2. Budget

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

**Вопросы в конспекте:**

- Чем ACTUAL отличается от FORECASTED?
- Зачем cost_filter по тегу?

---

## Задание 3. Cost allocation tag activation

В AWS Console (real account):

**Billing → Cost allocation tags** → Activate `Team`, `Environment`, `Service`.

Подождите 24h → Cost Explorer → Group by tag **Team**.

LocalStack: зафиксируйте шаги в README как «в prod сделаю так».

---

## Задание 4. Tag policy (опционально, Organizations)

Опишите JSON Tag Policy для enum `Environment` ∈ {dev, stage, prod} — не обязательно применять в lab account.

---

## Критерии успеха

- [ ] Terraform apply без ошибок
- [ ] Ресурс с 5 тегами из `default_tags`
- [ ] Budget resource создан
- [ ] Конспект: FORECASTED vs ACTUAL + screenshot/describe Explorer

---

## Cleanup

```bash
terraform destroy
```

Чеклист: [optional-aws-advanced](../aws-advanced/optional-aws-advanced.md).

**Дальше:** [14. Лаба cost report](14-lab-cost-report.md).
