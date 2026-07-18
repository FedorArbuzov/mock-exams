# 22. Лаба: tfsec в CI

## Задание 1. Локально

```bash
brew install tfsec   # или go install
cd courses/aws-intermediate/projects/image-platform
tfsec .
```

Исправьте HIGH (если false positive — `#tfsec:ignore:AWS018` с комментарием почему).

## Задание 2. Workflow

Создайте `.github/workflows/terraform-aws-intermediate.yml`:

```yaml
name: aws-intermediate-security

on:
  pull_request:
    paths:
      - "courses/aws-intermediate/**"
      - "courses/aws-terraform/projects/**"

jobs:
  tfsec:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/tfsec-action@v1.0.0
        with:
          working_directory: courses/aws-intermediate/projects/image-platform
          soft_fail: false

  validate:
    runs-on: ubuntu-latest
    defaults:
      run:
        working_directory: courses/aws-intermediate/projects/image-platform
    steps:
      - uses: actions/checkout@v4
      - uses: hashicorp/setup-terraform@v3
      - run: |
          cd lambda && zip -j ../lambda.zip handler.py
          cd ../lambda-api && zip -j ../lambda-api.zip api_handler.py
      - run: terraform init -backend=false && terraform validate
```

## Задание 3. OIDC (optional, real AWS)

Документируйте в `docs/github-oidc.md` шаги создания role — не коммитьте account id secrets.

## Задание 4. PR

Откройте PR с изменением README — workflow зелёный.

## Критерии успеха

- [ ] tfsec проходит без HIGH
- [ ] terraform validate в CI
- [ ] Документирован OIDC план (optional)

Следующий урок: [23-final-project.md](23-final-project.md).
