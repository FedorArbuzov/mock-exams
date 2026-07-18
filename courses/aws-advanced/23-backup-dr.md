# 23. Backup, CRR и disaster recovery

## RTO и RPO

| Метрика | Значение |
|---|---|
| **RPO** | сколько данных можно потерять (время между backup) |
| **RTO** | сколько downtime допустимо до восстановления |

## Статегии DR

| Стратегия | RTO | Стоимость |
|---|---|---|
| Backup & Restore | часы | $ |
| Pilot Light | десятки мин | $$ |
| Warm Standby | минуты | $$$ |
| Active-Active | секунды | $$$$ |

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

Versioning **обязательно** на source. Для thumbs/metadata — DR копия.

## DynamoDB global tables

Multi-region active-active — для strict RPO≈0 (дорого, сложный conflict resolution).

## Runbook

Документ: «region down» → переключить Route53 failover, поднять workers в secondary, проверить CRR bucket.

## Чек-лист

- RPO vs RTO?
- CRR требует versioning?
- Pilot light — что всегда включено?
- AWS Backup vs RDS automated backup?

Следующий урок: [24-lab-s3-crr.md](24-lab-s3-crr.md).
