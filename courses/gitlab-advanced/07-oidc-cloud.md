# 07. OIDC: GitLab → AWS

## Сценарий с работы

FinOps audit: IAM user `gitlab-ci` с `AdministratorAccess`, ключи в GitLab variables с 2022 года. Последний rotation — «мы забыли». Terraform plan в MR использует те же keys, что и apply на production. **OIDC** — стандарт industry для CI без static keys.

Terraform plan в MR требует read-only AWS. Классический shortcut — IAM user + keys в variables (protected, masked). Проблемы:

- **Долгоживущий секрет**
- **Blast radius** — один key на все ветки
- **Аудит** — сложно связать API call с job

**OpenID Connect (OIDC)** — краткосрочные credentials через `sts:AssumeRoleWithWebIdentity`.

Теория: [appsec-fundamentals/09-cloud-misconfig](../appsec-fundamentals/09-cloud-misconfig.md), [appsec-fundamentals/04-secrets-credentials](../appsec-fundamentals/04-secrets-credentials.md). Практика AWS: [aws-advanced/06-lab-oidc-ci.md](../aws-advanced/06-lab-oidc-ci.md).

---

## Что вы узнаете

- OIDC flow в GitLab CI (`id_tokens`).
- Настройку AWS OIDC provider и trust policy.
- Self-hosted vs GitLab.com.
- Риски fork MR и митигации.

---

## OIDC flow в GitLab CI

```text
GitLab job (id_tokens: AWS_ID_TOKEN)
    → JWT (iss, sub, aud, exp)
    → AWS STS AssumeRoleWithWebIdentity
    → temp AK/SK/SessionToken (~1h)
    → aws cli / terraform plan
```

| Claim JWT | Смысл |
|-----------|-------|
| `iss` | Issuer — `https://gitlab.com` или self-hosted |
| `aud` | Audience — trust policy |
| `sub` | Subject — project, ref, environment |
| `exp` | Expiry |

GitLab: keyword `id_tokens` (GitLab 15.7+).

---

## AWS: OIDC identity provider

```hcl
resource "aws_iam_openid_connect_provider" "gitlab" {
  url = "https://gitlab.com"
  client_id_list = ["https://gitlab.com"]
  thumbprint_list = ["<thumbprint>"]
}
```

Self-hosted:

```hcl
  url = "https://gitlab.example.com"
```

Thumbprint — из TLS cert chain issuer URL.

---

## Trust policy IAM Role

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {
      "Federated": "arn:aws:iam::ACCOUNT_ID:oidc-provider/gitlab.com"
    },
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Condition": {
      "StringEquals": {
        "gitlab.com:aud": "https://gitlab.com"
      },
      "StringLike": {
        "gitlab.com:sub": "project_path:platform/infra:ref_type:branch:ref:main"
      }
    }
  }]
}
```

### Зачем condition на `sub`

Без `sub` любой project с валидным JWT мог бы assume role. `StringLike` ограничивает project, ref, environment.

### Environment-scoped deploy

```json
"gitlab.com:sub": "project_path:platform/infra:environment:production:*"
```

+ manual job + protected environment.

---

## GitLab job configuration

```yaml
variables:
  AWS_ROLE_ARN: "arn:aws:iam::123456789012:role/gitlab-ci-readonly"
  AWS_DEFAULT_REGION: "eu-central-1"

terraform-plan:
  stage: validate
  image:
    name: amazon/aws-cli:2
    entrypoint: [""]
  id_tokens:
    AWS_ID_TOKEN:
      aud: https://gitlab.com
  script:
    - |
      CREDS=$(aws sts assume-role-with-web-identity \
        --role-arn "$AWS_ROLE_ARN" \
        --role-session-name "gitlab-${CI_PIPELINE_ID}" \
        --web-identity-token "$AWS_ID_TOKEN" \
        --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken]' \
        --output text)
      export AWS_ACCESS_KEY_ID=$(echo $CREDS | awk '{print $1}')
      export AWS_SECRET_ACCESS_KEY=$(echo $CREDS | awk '{print $2}')
      export AWS_SESSION_TOKEN=$(echo $CREDS | awk '{print $3}')
    - aws sts get-caller-identity
    - terraform init -backend=false
    - terraform plan -input=false
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

**Не логируйте** token и session credentials.

---

## Self-hosted vs GitLab.com

| | GitLab.com | Self-hosted |
|---|------------|-------------|
| Issuer URL | `https://gitlab.com` | `https://your.gitlab.host` |
| `aud` | `https://gitlab.com` | ваш URL |
| Condition key | `gitlab.com:sub` | `your.host:sub` |

---

## Temp credentials TTL

STS default **1 час**. Apply production — manual job с narrower role.

После job credentials **исчезают** — не кэшируйте между jobs.

---

## OIDC на MR из fork — риск

Fork MR может запускать pipeline с секретами если variables not protected и trust широкий.

**Митигация:**

- Protected branches only
- `rules: $CI_MERGE_REQUEST_SOURCE_PROJECT_ID == $CI_PROJECT_ID`
- Read-only role для plan; apply на `main` after merge

См. [appsec-fundamentals/07](../appsec-fundamentals/07-cicd-attacks.md).

---

## Сравнение с GitHub OIDC

[aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md):

| | GitHub Actions | GitLab CI |
|---|----------------|-----------|
| Token | `id-token: write` | `id_tokens:` |
| Issuer | `token.actions.githubusercontent.com` | `gitlab.com` |
| Subject | `repo:ORG/REPO:ref:refs/heads/main` | `project_path:group/repo:ref_type:branch:ref:main` |

---

## Terraform backend и OIDC

Separate roles:

- `gitlab-terraform-plan` — read state + read-only AWS
- `gitlab-terraform-apply` — write, manual, production

Не один `AdministratorAccess` на все jobs.

---

## OIDC vs masked AWS variable

| | Static key in variable | OIDC |
|---|------------------------|------|
| TTL | до rotation | ~1h |
| Scope | часто broad | trust policy `sub` |
| Fork MR risk | высокий | снижается с conditions |
| Audit | IAM user | assumed-role session |

---

## Самопроверка

1. Зачем `sub` condition?
2. OIDC vs masked variable?
3. Self-hosted issuer — что меняется?
4. TTL session — следствие?
5. Риск fork MR?

---

## Резюме

OIDC убирает long-lived AWS keys и привязывает доступ к project/ref через JWT. Лаба: [08-lab-oidc-aws.md](08-lab-oidc-aws.md).
