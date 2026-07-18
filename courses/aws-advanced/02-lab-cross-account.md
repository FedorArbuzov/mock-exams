# 02. Лаба: cross-account IAM role

## Цель

CI или admin из account **A** вызывает `sts:AssumeRole` в account **B**.

## Схема

```text
Account A (tools)                    Account B (workloads)
  IAM user/role github-ci    →       Role OrganizationAccountAccessRole
  sts:AssumeRole                     или custom role "DeployRole"
```

## Задание 1. Trust policy в account B

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "AWS": "arn:aws:iam::ACCOUNT_A_ID:root" },
    "Action": "sts:AssumeRole",
    "Condition": {
      "StringEquals": { "sts:ExternalId": "course-advanced-2026" }
    }
  }]
}
```

`ExternalId` — защита от confused deputy.

## Задание 2. Permission policy на role

Минимум для Terraform read-only:

```json
{
  "Effect": "Allow",
  "Action": ["s3:ListBucket", "s3:GetObject"],
  "Resource": "*"
}
```

## Задание 3. CLI из account A

```bash
aws sts assume-role \
  --role-arn arn:aws:iam::ACCOUNT_B:role/DeployRole \
  --role-session-name lab \
  --external-id course-advanced-2026

export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_SESSION_TOKEN=...
aws s3 ls
```

## Симуляция в одном account

Две role: `RoleA` assume `RoleB` — тот же механизм, другой Principal ARN.

## Критерии успеха

- [ ] AssumeRole возвращает временные credentials
- [ ] Session работает только с ExternalId
- [ ] Понимаете разницу trust vs permission policy

Следующий урок: [03-scp-governance.md](03-scp-governance.md).
