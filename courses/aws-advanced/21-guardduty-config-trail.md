# 21. GuardDuty, AWS Config, CloudTrail

## CloudTrail

**Audit log** API calls в AWS:

| Trail | Scope |
|---|---|
| Account trail | один account |
| **Organization trail** | все accounts → S3 в security account |

```text
API call → CloudTrail → S3 (immutable) → Athena / SIEM
```

Включите **log file validation** и lifecycle на bucket.

## AWS Config

**Configuration recorder** — snapshot ресурсов + **rules**:

| Rule | Проверка |
|---|---|
| `s3-bucket-public-read-prohibited` | compliance |
| `encrypted-volumes` | EBS |
| `rds-storage-encrypted` | RDS |

Non-compliant → SNS / Security Hub.

## GuardDuty

**Threat detection** (ML): unusual API, crypto mining, DNS exfil.

Finding types: `UnauthorizedAccess`, `Recon`, `CryptoCurrency`.

Aggregator — все accounts в org → security account.

## Security Hub

Центральная панель: GuardDuty + Config + Inspector findings.

## Операционный цикл

```text
Config drift / GuardDuty finding
    → EventBridge
    → Lambda / SNS / Jira ticket
    → Runbook
```

## Чек-лист

- CloudTrail vs Config — разница?
- Organization trail — зачем?
- Config rule — remediate или только alert?
- GuardDuty нужен agent? (нет)

Следующий урок: [22-lab-guardduty-config.md](22-lab-guardduty-config.md).
