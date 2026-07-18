# 22. Лаба: Config rule и CloudTrail

## Задание 1. Organization / account trail

```hcl
resource "aws_cloudtrail" "org" {
  name                          = "course-org-trail"
  s3_bucket_name                = aws_s3_bucket.trail.id
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
}
```

## Задание 2. Config rule

```hcl
resource "aws_config_config_rule" "s3_public" {
  name = "s3-bucket-public-access-prohibited"
  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }
}
```

Запустите recorder, создайте публичный bucket (в sandbox) — получите **NON_COMPLIANT**.

## Задание 3. GuardDuty

```bash
aws guardduty create-detector --enable
aws guardduty list-findings --detector-id DETECTOR_ID
```

Симулировать finding сложно — достаточно включить detector и описать реакцию в runbook.

## Задание 4. EventBridge → SNS

Rule на `GuardDuty Finding` → SNS topic для команды.

## Задание 5. Athena query (бонус)

CloudTrail logs в S3 → Athena table → `SELECT * WHERE eventName = 'AssumeRole'`.

## Критерии успеха

- [ ] Trail пишет в S3
- [ ] Config rule показывает compliance status
- [ ] GuardDuty detector enabled
- [ ] Runbook: 1 страница «что делать при HIGH finding»

Следующий урок: [23-backup-dr.md](23-backup-dr.md).
