# 12. Lab: secrets and KMS for S3

## Task 1. KMS key + alias

```hcl
resource "aws_kms_key" "app" {
  description = "course-intermediate-key"
}

resource "aws_kms_alias" "app" {
  name          = "alias/course-app"
  target_key_id = aws_kms_key.app.key_id
}
```

## Task 2. S3 SSE-KMS

Switch bucket encryption to `aws:kms` with your key (lesson 11).

## Task 3. Secret for API key (simulation)

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

Pass `API_SECRET_ARN` as a Lambda env var; the handler checks the `X-Api-Key` header (teaching pattern).

## Task 4. IAM

Add to the lambda policy:

- `secretsmanager:GetSecretValue` on the secret ARN
- `kms:Decrypt` on the KMS key

## Task 5. Verification

```bash
aws --endpoint-url=http://localhost:4566 secretsmanager get-secret-value \
  --secret-id course/api-key
```

## Success criteria

- [ ] S3 object upload with KMS (no AccessDenied error)
- [ ] Lambda reads the secret at runtime
- [ ] No plaintext api key in .tf files

Next lesson: [13-rds-private.md](13-rds-private.md).
