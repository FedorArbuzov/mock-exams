# 01. Terraform: HCL, провайдер, plan/apply

## Зачем IaC

**Infrastructure as Code** — инфраструктура описана в файлах, версионируется в Git, проверяется в CI. Вместо «создал bucket в Console» — `terraform apply` из того же коммита, что и код приложения.

| Подход | Плюсы | Минусы |
|---|---|---|
| Console / CLI вручную | Быстро для эксперимента | Drift, нет истории, ошибки человека |
| CloudFormation (AWS) | Нативно AWS | Только AWS, YAML/JSON |
| **Terraform** | Мультиоблако, HCL, экосистема | State нужно беречь |

## Как работает Terraform

```text
.tf файлы (HCL)
    → terraform plan  (что изменится?)
    → terraform apply (создать/изменить/удалить)
    → Provider API (AWS, Kubernetes, ...)
    → State file (terraform.tfstate) — карта «ресурс в коде ↔ id в облаке»
```

Terraform **декларативный**: вы описываете желаемое состояние, engine считает diff.

## HCL — минимальный пример

```hcl
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

resource "aws_s3_bucket" "course" {
  bucket = "my-unique-bucket-name-12345"
}
```

| Блок | Назначение |
|---|---|
| `terraform` | Версии Terraform и провайдеров |
| `provider` | Настройки плагина (регион, credentials) |
| `resource` | Создаваемый объект (`<provider>_<type>.<name>`) |
| `data` | Чтение существующего (не в первом уроке) |

## Жизненный цикл команд

```bash
terraform init      # скачать провайдеры, backend
terraform fmt       # форматирование .tf
terraform validate  # синтаксис
terraform plan      # план изменений
terraform apply     # применить (подтверждение или -auto-approve)
terraform destroy   # удалить всё из state
```

**init** обязателен после клонирования репо или смены `required_providers`.

## Resource graph

Terraform строит граф зависимостей. Если Lambda ссылается на IAM Role — role создастся первым (`depends_on` обычно не нужен — ссылки в атрибутах достаточно).

## Идемпотентность

Повторный `apply` без изменений в `.tf` → `No changes`. Это цель IaC.

## Что НЕ хранить в Git

- `terraform.tfstate` с секретами — для solo-лаб локально OK; в команде — **remote backend** (S3 + DynamoDB lock).
- `*.tfvars` с паролями — в `.gitignore`.

## Чек-лист

- Чем `plan` отличается от `apply`?
- Зачем `terraform init`?
- Что такое `resource` vs `provider`?
- Где Terraform хранит mapping имён ресурсов к ID в AWS?

Следующий урок: [02-lab-terraform-intro.md](02-lab-terraform-intro.md).
