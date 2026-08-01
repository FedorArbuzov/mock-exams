# 21. GuardDuty, AWS Config, CloudTrail

## CloudTrail

An **audit log** of API calls in AWS:

| Trail | Scope |
|---|---|
| Account trail | one account |
| **Organization trail** | all accounts → S3 in the security account |

```text
API call → CloudTrail → S3 (immutable) → Athena / SIEM
```

Enable **log file validation** and a lifecycle policy on the bucket.

## AWS Config

A **configuration recorder** — a snapshot of resources + **rules**:

| Rule | Check |
|---|---|
| `s3-bucket-public-read-prohibited` | compliance |
| `encrypted-volumes` | EBS |
| `rds-storage-encrypted` | RDS |

Non-compliant → SNS / Security Hub.

## GuardDuty

**Threat detection** (ML): unusual API, crypto mining, DNS exfil.

Finding types: `UnauthorizedAccess`, `Recon`, `CryptoCurrency`.

Aggregator — all accounts in the org → security account.

## Security Hub

A central dashboard: GuardDuty + Config + Inspector findings.

## Operational loop

```text
Config drift / GuardDuty finding
    → EventBridge
    → Lambda / SNS / Jira ticket
    → Runbook
```

## Checklist

- CloudTrail vs Config — the difference?
- Organization trail — why?
- Config rule — remediate or only alert?
- Does GuardDuty need an agent? (no)

Next lesson: [22-lab-guardduty-config.md](22-lab-guardduty-config.md).
