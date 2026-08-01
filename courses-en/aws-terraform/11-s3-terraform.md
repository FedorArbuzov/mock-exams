# 11. S3 in Terraform

## Core resources (provider AWS 5.x)

| Resource | Purpose |
|---|---|
| `aws_s3_bucket` | Bucket |
| `aws_s3_bucket_versioning` | Versioning |
| `aws_s3_bucket_server_side_encryption_configuration` | SSE |
| `aws_s3_bucket_public_access_block` | Block public access |
| `aws_s3_bucket_notification` | Events → Lambda/SQS/SNS |
| `aws_s3_object` | Upload a file from Terraform (rare in prod) |

## A secure bucket

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

## Notification to Lambda

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

**Order:** Lambda + permission → notification.

## CORS (for browser uploads)

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

In production, narrow `allowed_origins`.

## Importing an existing bucket

```bash
terraform import aws_s3_bucket.images my-existing-bucket
```

## Checklist

- Why is `public_access_block` a separate resource?
- Why `depends_on` on the lambda permission?
- What do `filter_prefix` / `filter_suffix` do?

Next lesson: [12-lab-s3-terraform.md](12-lab-s3-terraform.md).
