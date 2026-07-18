# 24. Лаба: S3 Cross-Region Replication

> Real AWS (два region). См. [optional-aws-advanced.md](optional-aws-advanced.md).

## Задание 1. Source bucket (eu-central-1)

Versioning enabled, SSE-KMS.

## Задание 2. Destination bucket (eu-west-1)

```hcl
resource "aws_s3_bucket_replication_configuration" "thumbs" {
  bucket = aws_s3_bucket.source.id
  role   = aws_iam_role.replication.arn
  rule {
    id     = "thumbs-crr"
    status = "Enabled"
    filter { prefix = "thumbs/" }
    destination {
      bucket        = aws_s3_bucket.destination.arn
      storage_class = "STANDARD"
    }
  }
}
```

IAM role: `s3:GetReplicationConfiguration`, `s3:ObjectReplication`, etc.

## Задание 3. Тест

Upload `thumbs/test.jpg` в source — через минуты объект в destination region.

```bash
aws s3 ls s3://DEST_BUCKET/thumbs/ --region eu-west-1
```

## Задание 4. Failover drill (tabletop)

Опишите шаги: primary region unavailable → DNS failover → read from CRR bucket.

## Критерии успеха

- [ ] Replication status REPLICA
- [ ] Object в destination
- [ ] Runbook на 10 шагов

Следующий урок: [25-cost-optimization.md](25-cost-optimization.md).
