# 11. S3 в Terraform

## Основные ресурсы (provider AWS 5.x)

| Resource | Назначение |
|---|---|
| `aws_s3_bucket` | Bucket |
| `aws_s3_bucket_versioning` | Versioning |
| `aws_s3_bucket_server_side_encryption_configuration` | SSE |
| `aws_s3_bucket_public_access_block` | Block public access |
| `aws_s3_bucket_notification` | Events → Lambda/SQS/SNS |
| `aws_s3_object` | Загрузить файл из Terraform (редко в prod) |

## Безопасный bucket

```hcl
resource "aws_s3_bucket" "images" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "images" {
  bucket = aws_s3_bucket.images.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}
```

## Notification на Lambda

```hcl
resource "aws_s3_bucket_notification" "uploads" {
  bucket = aws_s3_bucket.images.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.resize.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ".jpg"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}
```

**Порядок:** Lambda + permission → notification.

## CORS (для браузерной загрузки)

```hcl
resource "aws_s3_bucket_cors_configuration" "images" {
  bucket = aws_s3_bucket.images.id
  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT"]
    allowed_origins = var.cors_allowed_origins
    max_age_seconds = 3000
  }
}
```

В production сужайте `allowed_origins`.

## Импорт существующего bucket

```bash
terraform import aws_s3_bucket.images my-existing-bucket
```

## Чек-лист

- Зачем `public_access_block` отдельным ресурсом?
- Почему `depends_on` на lambda permission?
- Что делают `filter_prefix` / `filter_suffix`?

Следующий урок: [12-lab-s3-terraform.md](12-lab-s3-terraform.md).
