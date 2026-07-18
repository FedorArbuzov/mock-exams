# 12. Лаба: секреты и KMS для S3

## Задание 1. KMS key + alias

```hcl
resource "aws_kms_key" "app" {
  description = "course-intermediate-key"
}

resource "aws_kms_alias" "app" {
  name          = "alias/course-app"
  target_key_id = aws_kms_key.app.key_id
}
```

## Задание 2. S3 SSE-KMS

Переключите bucket encryption на `aws:kms` с вашим ключом (урок 11).

## Задание 3. Secret для API key (симуляция)

```hcl
resource "aws_secretsmanager_secret" "api_key" {
  name = "${var.project}/api-key"
}

resource "aws_secretsmanager_secret_version" "api_key" {
  secret_id     = aws_secretsmanager_secret.api_key.id
  secret_string = random_password.api_key.result
}

resource "random_password" "api_key" {
  length  = 32
  special = false
}
```

Передайте в Lambda `API_SECRET_ARN` env var; handler сверяет header `X-Api-Key` (учебный паттерн).

## Задание 4. IAM

Добавьте в lambda policy:

- `secretsmanager:GetSecretValue` на secret ARN
- `kms:Decrypt` на KMS key

## Задание 5. Проверка

```bash
aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value \
  --secret-id course/api-key
```

## Критерии успеха

- [ ] S3 object upload с KMS (без ошибки AccessDenied)
- [ ] Lambda читает secret в runtime
- [ ] Нет plaintext api key в .tf файлах

Следующий урок: [13-rds-private.md](13-rds-private.md).
