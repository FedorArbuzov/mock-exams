# 09. IAM in Terraform

## Resources

| Terraform resource | AWS entity |
|---|---|
| `aws_iam_role` | Role |
| `aws_iam_role_policy` | Inline policy on a role |
| `aws_iam_role_policy_attachment` | Managed policy → role |
| `aws_iam_policy` | Customer managed policy |
| `aws_lambda_permission` | Resource-based: who can invoke the Lambda |

## Role for Lambda

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

**Trust policy** — who can `AssumeRole` (here, the Lambda service).

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

S3 invokes the Lambda — a **resource-based** permission is required:

```hcl
resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resize.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.images.arn
}
```

Without this, the notification won't fire.

## Least privilege

- Don't use `AdministratorAccess` in labs.
- Restrict `Resource` to the ARNs of specific buckets/tables.
- For list bucket — a separate statement with `arn:...bucket` without `/*`.

## Checklist

- How does a trust policy differ from a permission policy?
- Why is `aws_lambda_permission` needed for S3?
- Why are there two Resource entries in the S3 statement (bucket and objects)?

Next lesson: [10-lab-iam-terraform.md](10-lab-iam-terraform.md).
