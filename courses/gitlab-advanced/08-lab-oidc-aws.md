# 08. Лаба: OIDC в AWS (опционально)

## Сценарий с работы

Security checklist: «Покажите `terraform plan` job log — там не должно быть `AWS_SECRET_ACCESS_KEY` в env dump». OIDC lab — доказательство zero static keys.

Compliance спрашивает: «Где rotation policy для CI credentials?» — с OIDC ответ: «TTL 1 час, rotation не нужна».

---

## Цель лабораторной

Настроить **OIDC federation** GitLab → AWS: `aws sts get-caller-identity` и `terraform plan` **без** keys в CI variables. Без AWS account — `docs/oidc-aws.md` по образцу [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md).

**Время:** ~120 мин (AWS) / ~60 мин (docs).  
**Предварительно:** [07-oidc-cloud.md](07-oidc-cloud.md).

---

## Выбор трека

| Трек | Результат |
|------|-----------|
| **AWS live** | Pipeline с `id_tokens`, STS в логе |
| **Docs only** | `docs/oidc-aws.md` complete |

---

## Трек AWS: Задание 1. OIDC provider

```hcl
resource "aws_iam_openid_connect_provider" "gitlab" {
  url             = "https://gitlab.com"
  client_id_list  = ["https://gitlab.com"]
  thumbprint_list = ["<thumbprint>"]
}
```

Self-hosted: свой `url` и `client_id_list`.

IAM → Identity providers → Active.

---

## Задание 2. Role `gitlab-ci-readonly`

Trust policy с **вашим** `project_path`:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/gitlab.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "gitlab.com:aud": "https://gitlab.com"
      },
      "StringLike": {
        "gitlab.com:sub": "project_path:platform/infra-terraform:ref_type:branch:ref:main"
      }
    }
  }]
}
```

Attach `ReadOnlyAccess`. `AWS_ROLE_ARN` в CI variable (не secret).

---

## Задание 3. Job `aws sts get-caller-identity`

```yaml
oidc-smoke:
  stage: validate
  image:
    name: amazon/aws-cli:2
    entrypoint: [""]
  id_tokens:
    AWS_ID_TOKEN:
      aud: https://gitlab.com
  variables:
    AWS_ROLE_ARN: "arn:aws:iam::ACCOUNT:role/gitlab-ci-readonly"
    AWS_DEFAULT_REGION: "eu-central-1"
  script:
    - |
      read -r AK SK ST < <(
        aws sts assume-role-with-web-identity \
          --role-arn "$AWS_ROLE_ARN" \
          --role-session-name "gitlab-${CI_PIPELINE_ID}" \
          --web-identity-token "$AWS_ID_TOKEN" \
          --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
          --output text
      )
      export AWS_ACCESS_KEY_ID="$AK" AWS_SECRET_ACCESS_KEY="$SK" AWS_SESSION_TOKEN="$ST"
    - aws sts get-caller-identity
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

**Успех:** `assumed-role/gitlab-ci-readonly`. **Нет** `AWS_SECRET_ACCESS_KEY` в Variables.

---

## Задание 4. Terraform plan на MR

```yaml
.oidc-aws-auth:
  id_tokens:
    AWS_ID_TOKEN:
      aud: https://gitlab.com
  before_script:
    - |
      read -r AK SK ST < <(
        aws sts assume-role-with-web-identity \
          --role-arn "$AWS_ROLE_ARN" \
          --role-session-name "gitlab-${CI_PIPELINE_ID}" \
          --web-identity-token "$AWS_ID_TOKEN" \
          --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
          --output text
      )
      export AWS_ACCESS_KEY_ID="$AK" AWS_SECRET_ACCESS_KEY="$SK" AWS_SESSION_TOKEN="$ST"

terraform-plan:
  extends: .oidc-aws-auth
  image: hashicorp/terraform:1.6
  script:
    - terraform init -input=false
    - terraform plan -input=false -no-color
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

Apply — **не** в этой лабе.

---

## Задание 5. Fork protection

```yaml
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event" && $CI_MERGE_REQUEST_SOURCE_PROJECT_ID != $CI_PROJECT_ID"
      when: never
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH == "main"
```

Документируйте в `docs/oidc-aws.md` § Security.

---

## Трек документации: `docs/oidc-aws.md`

1. **Проблема** static keys
2. **Диаграмма** OIDC flow
3. **Шаги** provider, role, job, plan
4. **Trust policy** с project_path
5. **Self-hosted** отличия
6. **Fork MR** риски
7. **Ссылка** [aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md)

---

## Задание 6. Проверка Variables

Settings → CI/CD → Variables:

- **Не должно быть** `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
- `AWS_ROLE_ARN` — обычная variable (ARN не секрет)

---

## Troubleshooting

| Ошибка | Причина |
|--------|---------|
| `Not authorized` | Trust `sub` / `aud` mismatch |
| Invalid token | Wrong `aud` in `id_tokens` |
| `AccessDenied` plan | Role policy narrow |
| Works main, not MR | `sub` only `ref:main` |

Debug: decode JWT payload **локально**, не в CI log.

---

## Критерии успеха

- [ ] Нет AWS access keys в Variables
- [ ] `get-caller-identity` shows assumed role
- [ ] `terraform plan` **или** `docs/oidc-aws.md`
- [ ] Trust policy ограничивает `project_path`
- [ ] Fork MR policy documented

---

## Связь с финальным проектом

[15-final-project.md](15-final-project.md) — OIDC **или** doc засчитывается.

---

## Резюме

OIDC — industry standard для cloud CI. Без AWS account достаточно полной документации. Следующий урок: [09-runners-kubernetes.md](09-runners-kubernetes.md).
