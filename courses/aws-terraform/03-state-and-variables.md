# 03. State, variables, outputs

## State — память Terraform

Файл **`terraform.tfstate`** (JSON) хранит:

- ID ресурсов в AWS (`arn`, `bucket`, …)
- Зависимости между ресурсами
- Метаданные для следующего `plan`

Без state Terraform не знает, что bucket `course-lab` — это **тот же** ресурс, что `aws_s3_bucket.lab`.

```text
resource "aws_s3_bucket" "lab"  ←── terraform.tfstate ──→  реальный bucket в AWS/LocalStack
```

**Никогда не правьте state вручную** без `terraform state` команд (кроме recovery).

## Remote state (кратко)

В команде state лежит в S3:

```hcl
terraform {
  backend "s3" {
    bucket         = "company-tfstate"
    key            = "aws/prod/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "tf-lock"
    encrypt        = true
  }
}
```

+ **state locking** — два `apply` не ломают инфраструктуру.

## Variables

| Тип объявления | Пример |
|---|---|
| `variable` | Входные параметры |
| `locals` | Вычисляемые константы внутри модуля |
| `terraform.tfvars` | Значения по умолчанию для окружения |
| `-var` / `TF_VAR_*` | Переопределение из CLI/CI |

```hcl
variable "environment" {
  type        = string
  description = "dev | staging | prod"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be dev, staging, or prod"
  }
}

locals {
  bucket_prefix = "course-${var.environment}"
}
```

## Outputs

Передают значения **наружу** — в CI, другой модуль, человеку:

```hcl
output "lambda_function_name" {
  value       = aws_lambda_function.resize.function_name
  description = "Name for aws lambda invoke"
}
```

```bash
terraform output bucket_name
terraform output -json
```

## Sensitive data

```hcl
output "db_password" {
  value     = var.db_password
  sensitive = true
}
```

В state секреты всё равно могут оказаться — лучше **Secrets Manager** + data source, не variable с паролем в plain text.

## Workspaces (кратко)

```bash
terraform workspace new dev
terraform workspace new prod
```

Один код — разные state-файлы. Альтернатива — отдельные каталоги или `-var-file=prod.tfvars`.

## Lifecycle meta-arguments

```hcl
resource "aws_s3_bucket" "lab" {
  bucket = var.bucket_name

  lifecycle {
    prevent_destroy = true   # terraform destroy не удалит
    ignore_changes  = [tags] # не менять при drift tags
  }
}
```

## Чек-лист

- Зачем нужен state?
- Чем `variable` отличается от `local`?
- Где задавать значения для prod без коммита в Git?
- Почему `sensitive = true` не равно «секрет не в state»?

Следующий урок: [04-lab-state-and-variables.md](04-lab-state-and-variables.md).
