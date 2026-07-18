# 02. Лаба: первый Terraform-проект

Цель: установить Terraform, инициализировать проект, создать S3 bucket **в LocalStack** (эмулятор запустим в уроке 06; здесь — структура проекта и команды).

## Подготовка

```bash
terraform version   # >= 1.5
mkdir -p ~/aws-labs/lesson-02
cd ~/aws-labs/lesson-02
```

Пока LocalStack не запущен — файлы готовим; `apply` сделаете в [06-lab-aws-provider-localstack.md](06-lab-aws-provider-localstack.md) или сразу после `docker compose up`.

## Задание 1. versions.tf

```hcl
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

## Задание 2. provider.tf (заглушка — endpoints добавите в уроке 06)

```hcl
provider "aws" {
  region                      = var.aws_region
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true

  s3_use_path_style = true

  endpoints {
    s3 = var.localstack_endpoint
  }
}
```

## Задание 3. variables.tf

```hcl
variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "localstack_endpoint" {
  type    = string
  default = "http://localhost:4566"
}

variable "bucket_name" {
  type        = string
  description = "Globally unique bucket name"
}
```

## Задание 4. main.tf

```hcl
resource "aws_s3_bucket" "lab" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_versioning" "lab" {
  bucket = aws_s3_bucket.lab.id
  versioning_configuration {
    status = "Enabled"
  }
}
```

## Задание 5. outputs.tf

```hcl
output "bucket_name" {
  value = aws_s3_bucket.lab.id
}

output "bucket_arn" {
  value = aws_s3_bucket.lab.arn
}
```

## Задание 6. terraform.tfvars

```hcl
bucket_name = "course-lab-02-yourname-123"
```

Замените `yourname` на уникальный суффикс.

## Задание 7. Команды

```bash
terraform init
terraform fmt -recursive
terraform validate
terraform plan -var-file=terraform.tfvars
```

После запуска LocalStack:

```bash
terraform apply -var-file=terraform.tfvars
```

**Что увидите:** `Plan: 2 to add` (bucket + versioning). После apply — outputs.

Проверка AWS CLI:

```bash
aws --endpoint-url=http://localhost:4566 s3 ls
```

## Задание 8. Уборка

```bash
terraform destroy -var-file=terraform.tfvars
```

## Критерии успеха

- [ ] `init` без ошибок
- [ ] `plan` показывает создание bucket
- [ ] `apply` завершился, bucket виден в `aws s3 ls`
- [ ] `destroy` удалил ресурсы

## Частые ошибки

| Ошибка | Решение |
|---|---|
| `connection refused :4566` | Запустите LocalStack |
| `BucketAlreadyExists` | Смените `bucket_name` |
| Provider auth error | Проверьте `skip_*` и `access_key = "test"` |

Следующий урок: [03-state-and-variables.md](03-state-and-variables.md).
