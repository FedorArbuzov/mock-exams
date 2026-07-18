# 22. Лаба: GitHub Actions workflow

## Задание 1. Скопировать workflow

В репозитории `mock-exams` создайте `.github/workflows/terraform-aws.yml` по образцу из [21-ci-terraform.md](21-ci-terraform.md).

Расширьте job **localstack-plan**:

```yaml
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - 4566:4566
    env:
      SERVICES: s3,lambda,dynamodb,iam,logs
      DEBUG: "0"

steps:
  # ... checkout, setup-terraform ...
  - name: Plan with LocalStack endpoints
    working-directory: courses/aws-terraform/projects/image-pipeline
    env:
      TF_VAR_use_localstack: "true"
      TF_VAR_localstack_endpoint: http://localhost:4566
    run: |
      terraform init -backend=false
      terraform validate
      terraform plan -input=false
```

Убедитесь, что `image-pipeline` поддерживает `use_localstack` variable (см. проект в репозитории).

## Задание 2. Локальная проверка

```bash
cd courses/aws-terraform/projects/image-pipeline
terraform fmt -recursive
terraform init -backend=false
terraform validate
```

## Задание 3. Push и PR

Откройте PR — workflow должен стать зелёным.

## Критерии успеха

- [ ] `fmt -check` проходит
- [ ] `validate` проходит
- [ ] `plan` в CI завершается (0 changes или ожидаемый diff)

Следующий урок: [23-final-project.md](23-final-project.md).
