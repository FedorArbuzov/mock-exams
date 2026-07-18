# 19. KMS: rotation, grants, multi-Region

## CMK lifecycle

| | AWS managed key | Customer managed CMK |
|---|---|---|
| Создание | автоматически | вы |
| Rotation | AWS | optional automatic yearly |
| Policy | AWS | ваш JSON |

```hcl
resource "aws_kms_key" "app" {
  enable_key_rotation = true
  description         = "App encryption"
}
```

## Key policy

Кто может `kms:Encrypt`, `kms:Decrypt`, `kms:GenerateDataKey`:

```json
{
  "Sid": "Allow use via S3",
  "Effect": "Allow",
  "Principal": { "AWS": "arn:aws:iam::123456789012:role/lambda-exec" },
  "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
  "Resource": "*"
}
```

## Multi-Region keys (MRK)

Один logical key в нескольких regions — DR без re-encrypt всего archive (сложная тема, знать на уровне «существует»).

## Secrets Manager + KMS

Secret шифруется CMK. **Rotation** — Lambda AWS пересоздаёт password RDS автоматически.

## CloudTrail

Все `kms:Decrypt` логируются — audit кто читал данные.

## Чек-лист

- enable_key_rotation — что ротирует?
- Key policy vs IAM policy?
- Зачем отдельный CMK на environment?
- Secrets rotation vs KMS rotation?

Следующий урок: [20-lab-kms-secrets.md](20-lab-kms-secrets.md).
