# 11. Terraform в GitLab CI

## Сценарий с работы

MR меняет `aws_s3_bucket` ACL. Reviewer не заметил. Apply на merge — данные публичны. Post-mortem: «нужен **plan в MR**». Второй кейс: `terraform apply` на каждый push в main без approval — state drift. Третий: plan на 4000 строк — никто не читает. Intermediate: **fmt → validate → plan (artifact)** на MR; **apply manual** на protected `main` — зеркало [aws-terraform/21-ci-terraform.md](../aws-terraform/21-ci-terraform.md).

Код: [`aws-terraform/projects/image-pipeline`](../aws-terraform/projects/image-pipeline/).

## Что вы узнаете

- Цели CI для IaC (без apply на каждый PR).
- Jobs `terraform fmt`, `validate`, `plan`, `apply`.
- Artifact **`plan.cache`** и `terraform apply plan.cache`.
- `TF_IN_AUTOMATION`, `init -backend=false` в MR.
- LocalStack / tflocal для учебного plan.

---

## Паттерн pipeline IaC

```text
MR opened / updated
    │
    ▼
┌─────────────┐   ┌──────────┐   ┌─────────────────────┐
│ fmt -check  │──▶│ validate │──▶│ plan → plan.cache   │
└─────────────┘   └──────────┘   │ (artifact, review)  │
                                 └─────────────────────┘

merge to main (protected)
    │
    ▼
┌─────────────┐   ┌──────────────────────────┐
│ init backend│──▶│ apply plan.cache (manual)│
└─────────────┘   └──────────────────────────┘
```

**Не apply в каждый MR** на shared account без human review.

---

## Plan job (MR)

```yaml
.terraform-base:
  image:
    name: hashicorp/terraform:1.7
    entrypoint: [""]
  variables:
    TF_IN_AUTOMATION: "true"
    TF_INPUT: "false"

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
      changes:
        - infrastructure/**/*
```

| Шаг | Зачем |
|-----|-------|
| `fmt -check` | CI падает при неотформатированном коде |
| `init -backend=false` | MR не пишет в remote state |
| `plan -out` | детерминированный apply позже |
| `artifacts` | apply скачает тот же plan |
| `changes:` | не гонять terraform на UI-only MR |

Проект `image-pipeline` описывает S3 → Lambda → DynamoDB pipeline ([README](../aws-terraform/projects/image-pipeline/README.md)).

---

## Apply job (manual, main)

```yaml
terraform-apply:
  extends: .terraform-base
  stage: deploy
  needs:
    - job: terraform-plan
      artifacts: true
      optional: true
  script:
    - cd infrastructure
    - terraform init
    - terraform apply -auto-approve plan.cache
  when: manual
  environment:
    name: production
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
      changes:
        - infrastructure/**/*
```

На main plan job может дублироваться с другими rules.

**Учебное предупреждение:** без LocalStack/AWS **не нажимайте apply** — только plan.

---

## LocalStack в CI (опционально)

По [aws-terraform/22-lab-ci-terraform.md](../aws-terraform/22-lab-ci-terraform.md):

```yaml
terraform-plan-localstack:
  extends: .terraform-base
  services:
    - name: localstack/localstack:latest
      alias: localstack
  variables:
    TF_VAR_use_localstack: "true"
    TF_VAR_localstack_endpoint: http://localstack:4566
    AWS_ACCESS_KEY_ID: test
    AWS_SECRET_ACCESS_KEY: test
    AWS_DEFAULT_REGION: us-east-1
  script:
    - cd infrastructure
    - terraform init -backend=false
    - terraform validate
    - terraform plan -input=false
```

---

## Secrets и AWS auth

| Подход | Курс |
|--------|------|
| Static keys в variables | только LocalStack |
| `TF_VAR_*` | параметры без коммита |
| OIDC → IAM role | [`gitlab-advanced`](../gitlab-advanced/README.md) |

Не коммитьте `*.tfvars` с secrets.

---

## Policy as Code (обзор)

```yaml
tfsec:
  stage: validate
  image: aquasec/tfsec:latest
  script:
    - tfsec infrastructure/
  allow_failure: true
```

---

## Связь с application pipeline

```text
app repo:     lint → docker → deploy k8s (mockctl)
infra repo:   terraform plan → (manual) apply
```

Application deploy — [`mockctl`](../../mockctl/README.md); infra — [`aws-terraform`](../aws-terraform/README.md).

---

## Типичные ошибки

**Apply без plan artifact** — drift.

**Plan в MR с backend write** — гонки state lock.

**Нет `fmt -check`** — шум в review.

**Parallel apply** — `resource_group` в GitLab 15+.

**Секреты в plan log** — `sensitive = true`.

---

## Резюме

- MR: fmt + validate + plan artifact; main: manual apply того же plan.
- `init -backend=false` на MR — не трогать remote state.
- `image-pipeline` — эталонный Terraform-код для лабы 12.

---

## Связи

| Материал | Связь |
|----------|-------|
| [12-lab-terraform-ci.md](12-lab-terraform-ci.md) | лаба image-pipeline |
| [aws-terraform/21](../aws-terraform/21-ci-terraform.md) | GitHub Actions аналог |
| [09-ci-templates.md](09-ci-templates.md) | `.terraform-base` |

---

## Чек-лист

- [ ] Зачем plan artifact
- [ ] Почему apply manual на main
- [ ] `init -backend=false` в MR
- [ ] `TF_IN_AUTOMATION`
- [ ] fmt в CI обязателен

Следующий урок: [12-lab-terraform-ci.md](12-lab-terraform-ci.md).
