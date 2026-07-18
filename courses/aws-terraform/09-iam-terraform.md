# 09. IAM в Terraform

## Ресурсы

| Terraform resource | AWS сущность |
|---|---|
| `aws_iam_role` | Role |
| `aws_iam_role_policy` | Inline policy на role |
| `aws_iam_role_policy_attachment` | Managed policy → role |
| `aws_iam_policy` | Customer managed policy |
| `aws_lambda_permission` | Resource-based: кто может вызвать Lambda |

## Role для Lambda

```hcl
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project}-lambda-exec"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}
```

**Trust policy** — кто может `AssumeRole` (здесь — сервис Lambda).

## Permission policy

```hcl
resource "aws_iam_role_policy" "lambda_s3_ddb" {
  name = "${var.project}-lambda-s3-ddb"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.images.arn,
          "${aws_s3_bucket.images.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem"
        ]
        Resource = aws_dynamodb_table.images.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}
```

## Lambda ← S3 permission

S3 вызывает Lambda — нужен **resource-based** permission:

```hcl
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resize.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.images.arn
}
```

Без этого notification не сработает.

## Least privilege

- Не используйте `AdministratorAccess` в лабах.
- Ограничивайте `Resource` ARN конкретных bucket/table.
- Для list bucket — отдельный statement с `arn:...bucket` без `/*`.

## Чек-лист

- Чем trust policy отличается от permission policy?
- Зачем `aws_lambda_permission` для S3?
- Почему для S3 два Resource в statement (bucket и objects)?

Следующий урок: [10-lab-iam-terraform.md](10-lab-iam-terraform.md).
