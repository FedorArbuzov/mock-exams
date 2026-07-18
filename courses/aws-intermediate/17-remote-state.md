# 17. Remote state и окружения

## Проблема local state

`terraform.tfstate` на ноутбуке:

- не в CI/CD,
- конфликты в команде,
- риск потери файла.

## S3 backend + DynamoDB lock

```hcl
terraform {
  backend "s3" {
    bucket         = "company-terraform-state"
    key            = "image-platform/dev/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
```

| Компонент | Роль |
|---|---|
| S3 bucket | хранение state (versioning включить) |
| DynamoDB | pessimistic lock (`LockID`) |
| encryption | SSE-S3 или KMS |

Bootstrap: state bucket создаётся **один раз** вручную или отдельным «bootstrap» стеком.

## Workspaces

```bash
terraform workspace new dev
terraform workspace new prod
terraform workspace select dev
```

Один код — state prefix `env:/dev/...` vs `env:/prod/...`.

## Альтернатива: каталоги

```text
environments/
  dev/
    main.tf      → module "../../platform" { ... }
  prod/
    main.tf
```

Явнее для code review, чаще в enterprise.

## tfvars per env

```hcl
# dev.tfvars
environment = "dev"
bucket_name = "course-images-dev-001"

# prod.tfvars
environment = "prod"
bucket_name = "course-images-prod-001"
```

## LocalStack backend

Для учёбы оставьте **local** backend или `terraform { backend "local" {} }`. Remote state lab — против **real** S3 bucket (free tier).

## Чек-лист

- Зачем DynamoDB lock?
- Bootstrap problem — что это?
- Workspaces vs отдельные каталоги?
- Почему state bucket не в том же apply?

Следующий урок: [18-lab-remote-state.md](18-lab-remote-state.md).
