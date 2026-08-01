# 02. Lab: cross-account IAM role

## Goal

CI or admin from account **A** calls `sts:AssumeRole` in account **B**.

## Diagram

```text
Account A (tools)                    Account B (workloads)
  IAM user/role github-ci    →       Role OrganizationAccountAccessRole
  sts:AssumeRole                     or custom role "DeployRole"
```

## Task 1. Trust policy in account B

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

`ExternalId` — protection against confused deputy.

## Task 2. Permission policy on the role

Minimum for Terraform read-only:

```json
{
  "Effect": "Allow",
  "Action": ["s3:ListBucket", "s3:GetObject"],
  "Resource": "*"
}
```

## Task 3. CLI from account A

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

## Simulation within one account

Two roles: `RoleA` assumes `RoleB` — same mechanism, different Principal ARN.

## Success criteria

- [ ] AssumeRole returns temporary credentials
- [ ] Session works only with ExternalId
- [ ] You understand the difference between trust and permission policy

Next lesson: [03-scp-governance.md](03-scp-governance.md).
