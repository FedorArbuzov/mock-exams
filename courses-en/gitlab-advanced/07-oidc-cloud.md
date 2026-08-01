# 07. OIDC: GitLab → AWS

## Real-world scenario

FinOps audit: an IAM user `gitlab-ci` with `AdministratorAccess`, keys in GitLab variables since 2022. Last rotation — "we forgot." Terraform plan in the MR uses the same keys as apply on production. **OIDC** is the industry standard for CI without static keys.

Terraform plan in an MR requires read-only AWS. The classic shortcut is an IAM user + keys in variables (protected, masked). Problems:

- **Long-lived secret**
- **Blast radius** — one key for all branches
- **Audit** — hard to tie an API call to a job

**OpenID Connect (OIDC)** — short-lived credentials via `sts:AssumeRoleWithWebIdentity`.

Theory: [appsec-fundamentals/09-cloud-misconfig](../appsec-fundamentals/09-cloud-misconfig.md), [appsec-fundamentals/04-secrets-credentials](../appsec-fundamentals/04-secrets-credentials.md). AWS practice: [aws-advanced/06-lab-oidc-ci.md](../aws-advanced/06-lab-oidc-ci.md).

---

## What you'll learn

- The OIDC flow in GitLab CI (`id_tokens`).
- Configuring the AWS OIDC provider and trust policy.
- Self-hosted vs GitLab.com.
- Fork MR risks and mitigations.

---

## OIDC flow in GitLab CI

```text
GitLab job (id_tokens: AWS_ID_TOKEN)
    → JWT (iss, sub, aud, exp)
    → AWS STS AssumeRoleWithWebIdentity
    → temp AK/SK/SessionToken (~1h)
    → aws cli / terraform plan
```

| JWT claim | Meaning |
|-----------|-------|
| `iss` | Issuer — `https://gitlab.com` or self-hosted |
| `aud` | Audience — trust policy |
| `sub` | Subject — project, ref, environment |
| `exp` | Expiry |

GitLab: the `id_tokens` keyword (GitLab 15.7+).

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

The thumbprint comes from the TLS cert chain of the issuer URL.

---

## IAM Role trust policy

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

### Why a condition on `sub`

Without `sub`, any project with a valid JWT could assume the role. `StringLike` restricts by project, ref, environment.

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

**Don't log** the token and session credentials.

---

## Self-hosted vs GitLab.com

| | GitLab.com | Self-hosted |
|---|------------|-------------|
| Issuer URL | `https://gitlab.com` | `https://your.gitlab.host` |
| `aud` | `https://gitlab.com` | your URL |
| Condition key | `gitlab.com:sub` | `your.host:sub` |

---

## Temp credentials TTL

STS default **1 hour**. Apply to production — a manual job with a narrower role.

After the job, the credentials **disappear** — don't cache them between jobs.

---

## OIDC on an MR from a fork — a risk

A fork MR can run a pipeline with secrets if variables aren't protected and the trust is broad.

**Mitigation:**

- Protected branches only
- `rules: $CI_MERGE_REQUEST_SOURCE_PROJECT_ID == $CI_PROJECT_ID`
- Read-only role for plan; apply on `main` after merge

See [appsec-fundamentals/07](../appsec-fundamentals/07-cicd-attacks.md).

---

## Comparison with GitHub OIDC

[aws-advanced/06](../aws-advanced/06-lab-oidc-ci.md):

| | GitHub Actions | GitLab CI |
|---|----------------|-----------|
| Token | `id-token: write` | `id_tokens:` |
| Issuer | `token.actions.githubusercontent.com` | `gitlab.com` |
| Subject | `repo:ORG/REPO:ref:refs/heads/main` | `project_path:group/repo:ref_type:branch:ref:main` |

---

## Terraform backend and OIDC

Separate roles:

- `gitlab-terraform-plan` — read state + read-only AWS
- `gitlab-terraform-apply` — write, manual, production

Not a single `AdministratorAccess` for all jobs.

---

## OIDC vs masked AWS variable

| | Static key in variable | OIDC |
|---|------------------------|------|
| TTL | until rotation | ~1h |
| Scope | often broad | trust policy `sub` |
| Fork MR risk | high | reduced with conditions |
| Audit | IAM user | assumed-role session |

---

## Self-check

1. Why the `sub` condition?
2. OIDC vs masked variable?
3. Self-hosted issuer — what changes?
4. Session TTL — what's the consequence?
5. The fork MR risk?

---

## Summary

OIDC removes long-lived AWS keys and ties access to project/ref via a JWT. Lab: [08-lab-oidc-aws.md](08-lab-oidc-aws.md).
