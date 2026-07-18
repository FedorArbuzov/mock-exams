# 21. CI: Terraform в GitHub Actions

## Цели CI для IaC

| Job | Команда | Зачем |
|---|---|---|
| Format | `terraform fmt -check` | Единый стиль |
| Validate | `terraform validate` | Синтаксис |
| Plan | `terraform plan` | Review diff в PR |
| Apply | `terraform apply` | Только protected branch + approval |

**Не apply в каждый PR** на shared account без review.

## Минимальный workflow

```yaml
name: terraform

on:
  pull_request:
    paths:
      - "courses/aws-terraform/projects/**"
      - ".github/workflows/terraform-aws.yml"

jobs:
  plan:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: courses/aws-terraform/projects/image-pipeline
    steps:
      - uses: actions/checkout@v4

      - uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: "1.7.0"

      - name: Init
        run: terraform init -backend=false

      - name: Format
        run: terraform fmt -check -recursive

      - name: Validate
        run: terraform validate

      - name: Plan (no backend)
        run: terraform plan -input=false
        env:
          AWS_ACCESS_KEY_ID: test
          AWS_SECRET_ACCESS_KEY: test
          AWS_DEFAULT_REGION: us-east-1
```

Для **plan против LocalStack** в CI — сервис-контейнер LocalStack (см. лабу 22).

## Secrets

- `AWS_ROLE_ARN` + OIDC — без long-lived keys.
- `TF_VAR_*` — не коммитить секреты.

## terraform plan в PR

Комментарий с планом: `terraform plan | tfnotify` или встроенные GitHub Actions (Atlantis, OpenTofu с аналогами).

## Policy as Code (упоминание)

**OPA / Sentinel / tfsec / checkov** — скан `.tf` на публичные bucket, открытые SG. Для security-курса — отдельная тема.

## Чек-лист

- Почему `fmt -check` в CI?
- Зачем `init -backend=false` в PR?
- Почему apply только из main с approval?

Следующий урок: [22-lab-ci-terraform.md](22-lab-ci-terraform.md).
