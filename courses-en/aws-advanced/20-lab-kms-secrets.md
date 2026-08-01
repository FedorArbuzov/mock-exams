# 20. Lab: KMS rotation and Secrets

## Task 1. CMK with rotation

```hcl
resource "aws_kms_key" "app" {
  enable_key_rotation = true
}
```

## Task 2. S3 bucket policy to enforce KMS

Deny upload without SSE-KMS:

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

## Task 3. RDS secret rotation (real AWS)

```hcl
resource "aws_secretsmanager_secret_rotation" "db" {
  secret_id           = aws_secretsmanager_secret.db.id
  rotation_lambda_arn = aws_serverlessapplicationrepository_cloudformation_stack.rotate.arn
  rotation_rules {
    automatically_after_days = 30
  }
}
```

Or the Console: enable rotation → managed Lambda.

## Task 4. CloudTrail sample

Find the `Decrypt` event for your CMK after `aws s3 cp`.

## Success criteria

- [ ] PutObject without KMS headers denied (bucket policy)
- [ ] Rotation enabled on the secret or CMK
- [ ] Lambda/IRSA role has kms:Decrypt

Next lesson: [21-guardduty-config-trail.md](21-guardduty-config-trail.md).
