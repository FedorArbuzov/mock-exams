# 04. Лаба: variables, locals, outputs

Продолжаем проект из урока 02. Добавим `environment`, `locals` и условный тег.

## Задание 1. Расширить variables.tf

```hcl
variable "environment" {
  type        = string
  default     = "dev"
  description = "Environment label"
}

variable "project" {
  type    = string
  default = "aws-course"
}
```

## Задание 2. locals.tf

```hcl
locals {
  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}
```

## Задание 3. Теги на bucket (AWS provider 5.x)

В provider 5.x теги — отдельный ресурс:

```hcl
resource "aws_s3_bucket" "lab" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_tags" "lab" {
  bucket = aws_s3_bucket.lab.id
  tags   = local.common_tags
}
```

## Задание 4. output с metadata

```hcl
output "tags" {
  value = local.common_tags
}
```

## Задание 5. Два окружения через tfvars

`dev.tfvars`:

```hcl
bucket_name = "course-dev-yourname-123"
environment = "dev"
```

`staging.tfvars`:

```hcl
bucket_name = "course-staging-yourname-123"
environment = "staging"
```

Применить dev:

```bash
terraform apply -var-file=dev.tfvars
```

**Что увидите:** другой bucket name, тег `Environment = dev`.

## Задание 6. Посмотреть state

```bash
terraform state list
terraform state show aws_s3_bucket.lab
```

**Что увидите:** реальный id bucket и атрибуты — то, что Terraform запомнил.

## Задание 7. Validation

Добавьте в `variable "environment"` блок `validation` из урока 03. Попробуйте:

```bash
terraform plan -var="environment=invalid"
```

Должна быть ошибка до обращения к AWS.

## Критерии успеха

- [ ] `terraform output tags` показывает common_tags
- [ ] `state list` содержит bucket и tags resource
- [ ] validation отклоняет неверный environment

Следующий урок: [05-aws-provider-localstack.md](05-aws-provider-localstack.md).
