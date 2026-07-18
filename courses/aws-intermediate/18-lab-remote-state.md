# 18. Лаба: S3 backend (real AWS)

> Выполняется в **dev-account**. LocalStack backend для state не используйте в production-паттерне.

## Задание 1. Bootstrap (один раз)

`bootstrap/main.tf`:

```hcl
resource "aws_s3_bucket" "tfstate" {
  bucket = "course-tfstate-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_dynamodb_table" "lock" {
  name         = "course-terraform-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
}
```

```bash
cd bootstrap && terraform apply
```

## Задание 2. Backend в platform

```hcl
terraform {
  backend "s3" {
    bucket         = "course-tfstate-ACCOUNT_ID"
    key            = "image-platform/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "course-terraform-locks"
    encrypt        = true
  }
}
```

`terraform init -migrate-state` — перенос local → remote.

## Задание 3. Workspaces

```bash
terraform workspace new dev
terraform workspace new staging
terraform workspace select dev
terraform apply -var-file=dev.tfvars
```

## Задание 4. Проверка lock

В двух терминалах одновременно `terraform apply` — второй должен ждать lock.

## Критерии успеха

- [ ] State в S3, versioning on
- [ ] Параллельный apply блокируется
- [ ] `workspace list` показывает dev/staging

Следующий урок: [19-cloudwatch.md](19-cloudwatch.md).
