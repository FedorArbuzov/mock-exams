# 06. Lab: GitHub OIDC → prod account

Continuation of [aws-intermediate/21-security-ci.md](../aws-intermediate/21-security-ci.md) for a **separate prod account**.

## Task 1. OIDC provider in IAM

```hcl
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03fa0217a0809543b950e1b1a8"]
}
```

## Task 2. Role for the repository

Trust policy with `StringLike`:

```json
"token.actions.githubusercontent.com:sub": "repo:ORG/mock-exams:ref:refs/heads/main"
```

Permission: `ReadOnlyAccess` for plan; a separate role with `PowerUserAccess` only through a **GitHub Environment** `production` + manual approval.

## Task 3. Workflow

```yaml
permissions:
  id-token: write
jobs:
  plan:
    environment: production
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::PROD:role/github-terraform-prod
```

## Task 4. Cross-account

Plan in the dev account (read-only prod role) vs apply only from a protected environment.

## Success criteria

- [ ] No `AWS_SECRET_ACCESS_KEY` in GitHub secrets for AWS
- [ ] Workflow on PR — plan only
- [ ] Apply only with approval on the environment

Next lesson: [07-transit-gateway.md](07-transit-gateway.md).
