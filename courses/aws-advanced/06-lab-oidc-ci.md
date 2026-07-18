# 06. Лаба: GitHub OIDC → prod account

Продолжение [aws-intermediate/21-security-ci.md](../aws-intermediate/21-security-ci.md) для **отдельного prod account**.

## Задание 1. OIDC provider в IAM

```hcl
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03fa0217a0809543b950e1b1a8"]
}
```

## Задание 2. Role для репозитория

Trust policy с `StringLike`:

```json
"token.actions.githubusercontent.com:sub": "repo:ORG/mock-exams:ref:refs/heads/main"
```

Permission: `ReadOnlyAccess` для plan; отдельная role с `PowerUserAccess` только через **GitHub Environment** `production` + manual approval.

## Задание 3. Workflow

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

## Задание 4. Cross-account

Plan в dev account (read-only prod role) vs apply только из protected environment.

## Критерии успеха

- [ ] Нет `AWS_SECRET_ACCESS_KEY` в GitHub secrets для AWS
- [ ] Workflow на PR — только plan
- [ ] Apply только с approval на environment

Следующий урок: [07-transit-gateway.md](07-transit-gateway.md).
