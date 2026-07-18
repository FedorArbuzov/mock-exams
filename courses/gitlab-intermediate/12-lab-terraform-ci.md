# 12. Лаба: Terraform plan на MR

## Сценарий с работы

Infra изменения без plan в review — дорогой класс ошибок. Platform требует: **зелёный terraform plan** в MR до merge. Apply — отдельная кнопка на protected `main`. Вы подключите GitLab CI к [`image-pipeline`](../aws-terraform/projects/image-pipeline/) — тот же Terraform-код, что в курсе aws-terraform (S3, Lambda, DynamoDB).

**Предусловия:** [11-terraform-ci.md](11-terraform-ci.md), базовый Terraform. AWS/LocalStack для apply **не обязателен** — достаточно plan с `init -backend=false`.

## Что вы сделаете

- Импортируете `image-pipeline` в GitLab (отдельный проект или monorepo `infrastructure/`).
- Добавите jobs `terraform-plan` и `terraform-apply` (manual).
- Откроете MR с изменением `.tf` и прочитаете plan в логе.
- Скачаете artifact `plan.cache`.

---

## Задание 1. Проект в GitLab

Проект `image-pipeline-infra` (или подпапка в app-репозитории):

```text
infrastructure/
├── versions.tf
├── provider.tf
├── variables.tf
├── s3.tf
├── lambda.tf
├── dynamodb.tf
├── iam.tf
├── notification.tf
├── outputs.tf
└── lambda/
    ├── handler.py
    └── requirements.txt
```

Скопируйте из [`aws-terraform/projects/image-pipeline`](../aws-terraform/projects/image-pipeline/).

`terraform.tfvars.example` → `terraform.tfvars` **локально**, в `.gitignore`. Секреты — только CI variables (`TF_VAR_*`).

---

## Задание 2. Pipeline

```yaml
stages:
  - validate
  - deploy

workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
    - when: never

.terraform-base:
  image:
    name: hashicorp/terraform:1.7
    entrypoint: [""]
  variables:
    TF_IN_AUTOMATION: "true"
    TF_INPUT: "false"
  tags: [docker]

terraform-plan:
  extends: .terraform-base
  stage: validate
  script:
    - cd infrastructure
    - terraform init -backend=false
    - terraform fmt -check -recursive
    - terraform validate
    - terraform plan -out=plan.cache
  artifacts:
    paths:
      - infrastructure/plan.cache
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"

terraform-apply:
  extends: .terraform-base
  stage: deploy
  needs:
    - job: terraform-plan
      artifacts: true
  script:
    - cd infrastructure
    - terraform init
    - terraform apply -auto-approve plan.cache
  when: manual
  environment:
    name: production
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

| Job | Backend | Apply? |
|-----|---------|--------|
| plan (MR) | `init -backend=false` | нет |
| apply (main) | полный `init` | manual |

Runner с tag `docker` — из [`deploy/gitlab`](../../deploy/gitlab/README.md).

---

## Задание 3. MR workflow

1. Ветка `feature/add-s3-tag`.
2. В `s3.tf` добавьте tag:

```hcl
tags = {
  Project     = "image-pipeline"
  Managed     = "gitlab-ci-lab"
  Environment = "lab"
}
```

3. Push, MR в `main`.
4. Job `terraform-plan` — **passed**.
5. В логе — блок `Plan:` N to add, 0 to change, 0 to destroy (или change).

Reviewer читает plan **до** merge — зеркало [aws-terraform/21-ci-terraform.md](../aws-terraform/21-ci-terraform.md).

---

## Задание 4. Artifact plan.cache

**Job artifacts** в UI pipeline — скачайте `plan.cache`.

Локально:

```bash
cd infrastructure
terraform init -backend=false
terraform show plan.cache
```

Убедитесь, что diff совпадает с логом job.

---

## Задание 5. Apply (только осознанно)

**Не нажимайте** apply без LocalStack или тестового AWS account.

С LocalStack по [aws-terraform/22-lab-ci-terraform.md](../aws-terraform/22-lab-ci-terraform.md):

```yaml
  variables:
    TF_VAR_use_localstack: "true"
```

Тогда manual apply безопасен в учебной среде.

---

## Задание 6. (Бонус) include template

Вынесите `.terraform-base` и `terraform-plan` в `ci/terraform-plan.yml` ([10-lab-templates.md](10-lab-templates.md)):

```yaml
include:
  - local: ci/terraform-plan.yml
```

---

## Задание 7. (Бонус) changes: filter

```yaml
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
      changes:
        - infrastructure/**/*
```

Terraform jobs не бегут на MR, меняющий только `app/` или README.

---

## Что пошло не так

### `fmt -check` failed

**Решение:** `terraform fmt -recursive` локально; commit.

### `validate` failed

**Решение:** `terraform validate` локально; проверить `versions.tf` и provider block.

### Plan skipped on MR

**Причина:** `workflow:rules` или `changes:` слишком узкий.

**Решение:** временно убрать `changes:` для отладки.

### Apply: no plan.cache

**Причина:** `needs` без `artifacts: true`; apply в pipeline другого SHA.

**Решение:** apply только в main pipeline того же commit, что plan.

### Provider AWS unreachable

**Ожидаемо** без credentials — используйте `TF_VAR_use_localstack` как в image-pipeline README.

### State lock error on apply

**Причина:** параллельные apply jobs.

**Решение:** `resource_group: terraform` в GitLab 15+.

---

## Резюме

- Terraform CI зеркалит app CI: plan на MR, apply manual на main.
- `image-pipeline` — реальный проект из [`aws-terraform`](../aws-terraform/README.md).

---

## Критерии успеха

- [ ] `fmt -check`, `validate`, `plan` зелёные на MR
- [ ] В логе plan осмысленный diff
- [ ] Artifact `plan.cache` скачивается
- [ ] `terraform-apply` manual только на `main`
- [ ] Apply не запускали без тестового backend

---

## Связи

| Дальше | Содержание |
|--------|------------|
| [13-final-project.md](13-final-project.md) | app + infra в одном portfolio |
| [aws-terraform/21-22](../aws-terraform/21-ci-terraform.md) | GitHub Actions вариант |

Следующий урок: [13-final-project.md](13-final-project.md).
