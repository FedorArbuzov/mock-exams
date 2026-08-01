# 01. AWS Organizations

## Why Organizations

One **management account** ties together several **member accounts**:

```text
Management (billing, SCP, org policies)
├── Security (logs, GuardDuty aggregator)
├── Workloads-dev
└── Workloads-prod
```

| Benefit | Description |
|---|---|
| Consolidated billing | one bill, breakdown by account |
| SCP | guardrails on top of IAM |
| Blast radius isolation | compromise of dev ≠ prod |
| Centralized audit | CloudTrail org trail |

## Organizational Units (OU)

```text
Root
├── Security OU
├── Sandbox OU
└── Workloads OU
      ├── dev
      └── prod
```

SCP policies are attached to an **OU** or **account** — they are inherited downward.

## Creating an account

- **AWS Control Tower** — account factory with a baseline.
- **Organizations API** — `CreateAccount` (email must be unique).
- **Account vending** via Terraform `aws_organizations_account` (be careful with email).

## Root user

In a member account the root user still exists — **do not use it** for daily ops. Break-glass only.

## Relation to intermediate

Intermediate — a single account. Advanced — the **account boundary** as a security and billing boundary.

## Checklist

- How does an OU differ from an account?
- Why a separate security account?
- Why are prod and dev separate accounts?
- What is consolidated billing?

Next lesson: [02-lab-cross-account.md](02-lab-cross-account.md).
