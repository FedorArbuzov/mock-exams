# 11. Secrets Manager и KMS

> Универсальная модель Vault (policies, dynamic secrets, PKI): [secrets-basic](../secrets-basic/README.md) → [advanced](../secrets-advanced/README.md) ([`deploy/vault`](../../deploy/vault/README.md)). Здесь — **AWS-native** хранение и шифрование.

## Проблема

Пароль RDS в `terraform.tfvars` → попадает в Git, state, CI logs.

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

Lambda / ECS читают в runtime:

```python
import boto3
boto3.client("secretsmanager").get_secret_value(SecretId=os.environ["DB_SECRET_ARN"])
```

## KMS

**Customer Managed Key (CMK)** — вы контролируете rotation и policy.

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

## IAM для KMS

Lambda role needs `kms:Decrypt` on key + `secretsmanager:GetSecretValue` on secret ARN.

## SSM Parameter Store (альтернатива)

| | Secrets Manager | SSM SecureString |
|---|---|---|
| Rotation | встроенная для RDS | ручная |
| Цена | выше | дешевле для простых секретов |

## Чек-лист

- Почему пароль не в tfvars?
- SSE-KMS vs SSE-S3?
- Кто может расшифровать секрет?
- Где секрет всё ещё виден? (state — да, при plain secret_version)

Следующий урок: [12-lab-secrets-kms.md](12-lab-secrets-kms.md).
