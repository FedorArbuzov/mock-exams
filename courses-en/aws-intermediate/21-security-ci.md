# 21. Security CI: tfsec, checkov, OIDC

## Static analysis

| Tool | Run |
|---|---|
| **tfsec** | `tfsec .` |
| **checkov** | `checkov -d .` |
| **trivy** config | `trivy config .` |

Typical findings:

- S3 bucket public ACL
- Security group `0.0.0.0/0` on 22
- Unencrypted RDS

## In GitHub Actions

```yaml
- name: tfsec
  uses: aquasecurity/tfsec-action@v1.0.0
  with:
    soft_fail: false
```

On PR — **block merge** on HIGH.

## OIDC instead of access keys

```text
GitHub Actions
    → OIDC token
    → AWS STS AssumeRoleWithWebIdentity
    → temporary credentials
    → terraform apply (only with approval)
```

Trust policy on the role:

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

## Plan-only on PR, apply on main

```yaml
on:
  pull_request:
    jobs: [plan]
  push:
    branches: [main]
    jobs: [apply]  # environment protection
```

## Checklist

- Why is OIDC better than `AWS_ACCESS_KEY_ID` in secrets?
- Why not apply on every PR?
- What does tfsec check?
- Condition on `sub` — why?

Next lesson: [22-lab-security-ci.md](22-lab-security-ci.md).
