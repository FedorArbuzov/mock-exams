# 23. Backup, CRR and disaster recovery

## RTO and RPO

| Metric | Meaning |
|---|---|
| **RPO** | how much data you can lose (time between backups) |
| **RTO** | how much downtime is acceptable before recovery |

## DR strategies

| Strategy | RTO | Cost |
|---|---|---|
| Backup & Restore | hours | $ |
| Pilot Light | tens of minutes | $$ |
| Warm Standby | minutes | $$$ |
| Active-Active | seconds | $$$$ |

## AWS Backup

Centralized backup plans: EBS, RDS, DynamoDB, EFS.

```hcl
resource "aws_backup_plan" "daily" {
  name = "course-daily"
  rule {
    rule_name         = "daily-7d"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * * *)"
    lifecycle {
      delete_after = 7
    }
  }
}
```

## S3 Cross-Region Replication (CRR)

```text
Bucket eu-central-1 (source)
    → replication rule → bucket eu-west-1 (destination)
```

Versioning is **mandatory** on the source. For thumbs/metadata — a DR copy.

## DynamoDB global tables

Multi-region active-active — for strict RPO≈0 (expensive, complex conflict resolution).

## Runbook

A document: "region down" → switch Route53 failover, bring up workers in the secondary, check the CRR bucket.

## Checklist

- RPO vs RTO?
- Does CRR require versioning?
- Pilot light — what is always on?
- AWS Backup vs RDS automated backup?

Next lesson: [24-lab-s3-crr.md](24-lab-s3-crr.md).
