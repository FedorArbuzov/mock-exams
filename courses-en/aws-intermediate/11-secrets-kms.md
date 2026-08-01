# 11. Secrets Manager and KMS

> Universal Vault model (policies, dynamic secrets, PKI): [secrets-basic](../secrets-basic/README.md) → [advanced](../secrets-advanced/README.md) ([`deploy/vault`](../../deploy/vault/README.md)). Here — **AWS-native** storage and encryption.

## The problem

RDS password in `terraform.tfvars` → ends up in Git, state, CI logs.

## Secrets Manager

```hcl
resource "aws_secretsmanager_secret" "db" {
  name = "${var.project}/db/master"
}

resource "aws_secretsmanager_secret_version" "db" {
  secret_id = aws_secretsmanager_secret.db.id
  secret_string = jsonencode({
    username = "app"
    password = random_password.db.result
  })
}

resource "random_password" "db" {
  length  = 24
  special = true
}
```

Lambda / ECS read at runtime:

```python
import boto3
boto3.client("secretsmanager").get_secret_value(SecretId=os.environ["DB_SECRET_ARN"])
```

## KMS

**Customer Managed Key (CMK)** — you control rotation and policy.

```hcl
resource "aws_kms_key" "app" {
  description             = "Course app encryption"
  deletion_window_in_days = 7
}

resource "aws_s3_bucket_server_side_encryption_configuration" "images" {
  bucket = aws_s3_bucket.images.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.app.arn
    }
  }
}
```

## IAM for KMS

Lambda role needs `kms:Decrypt` on the key + `secretsmanager:GetSecretValue` on the secret ARN.

## SSM Parameter Store (alternative)

| | Secrets Manager | SSM SecureString |
|---|---|---|
| Rotation | built-in for RDS | manual |
| Cost | higher | cheaper for simple secrets |

## Checklist

- Why not put the password in tfvars?
- SSE-KMS vs SSE-S3?
- Who can decrypt the secret?
- Where is the secret still visible? (state — yes, with a plain secret_version)

Next lesson: [12-lab-secrets-kms.md](12-lab-secrets-kms.md).
