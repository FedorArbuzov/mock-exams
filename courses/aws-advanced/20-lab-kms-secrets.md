# 20. Лаба: KMS rotation и Secrets

## Задание 1. CMK с rotation

```hcl
resource "aws_kms_key" "app" {
  enable_key_rotation = true
}
```

## Задание 2. S3 bucket policy enforce KMS

Deny upload без SSE-KMS:

```json
{
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:PutObject",
  "Resource": "arn:aws:s3:::BUCKET/*",
  "Condition": {
    "StringNotEquals": {
      "s3:x-amz-server-side-encryption": "aws:kms"
    }
  }
}
```

## Задание 3. RDS secret rotation (real AWS)

```hcl
resource "aws_secretsmanager_secret_rotation" "db" {
  secret_id           = aws_secretsmanager_secret.db.id
  rotation_lambda_arn = aws_serverlessapplicationrepository_cloudformation_stack.rotate.arn
  rotation_rules {
    automatically_after_days = 30
  }
}
```

Или Console: enable rotation → managed Lambda.

## Задание 4. CloudTrail sample

Найдите `Decrypt` event для вашего CMK после `aws s3 cp`.

## Критерии успеха

- [ ] PutObject без KMS headers denied (bucket policy)
- [ ] Rotation enabled на secret или CMK
- [ ] Lambda/IRSA role имеет kms:Decrypt

Следующий урок: [21-guardduty-config-trail.md](21-guardduty-config-trail.md).
