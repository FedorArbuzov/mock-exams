# 21. Security CI: tfsec, checkov, OIDC

## Static analysis

| Tool | Запуск |
|---|---|
| **tfsec** | `tfsec .` |
| **checkov** | `checkov -d .` |
| **trivy** config | `trivy config .` |

Типичные находки:

- S3 bucket public ACL
- Security group `0.0.0.0/0` на 22
- Unencrypted RDS

## В GitHub Actions

```yaml
- name: tfsec
  uses: aquasecurity/tfsec-action@v1.0.0
  with:
    soft_fail: false
```

На PR — **block merge** при HIGH.

## OIDC вместо access keys

```text
GitHub Actions
    → OIDC token
    → AWS STS AssumeRoleWithWebIdentity
    → временные credentials
    → terraform apply (только с approval)
```

Trust policy на role:

```json
{
  "Effect": "Allow",
  "Principal": {
    "Federated": "arn:aws:iam::ACCOUNT:oidc-provider/token.actions.githubusercontent.com"
  },
  "Action": "sts:AssumeRoleWithWebIdentity",
  "Condition": {
    "StringEquals": {
      "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
    },
    "StringLike": {
      "token.actions.githubusercontent.com:sub": "repo:ORG/mock-exams:*"
    }
  }
}
```

Workflow:

```yaml
permissions:
  id-token: write
  contents: read

- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::123456789012:role/github-terraform
    aws-region: us-east-1
```

## Plan-only в PR, apply в main

```yaml
on:
  pull_request:
    jobs: [plan]
  push:
    branches: [main]
    jobs: [apply]  # environment protection
```

## Чек-лист

- Зачем OIDC лучше `AWS_ACCESS_KEY_ID` в secrets?
- Почему apply не в каждом PR?
- Что проверяет tfsec?
- Condition на `sub` — зачем?

Следующий урок: [22-lab-security-ci.md](22-lab-security-ci.md).
