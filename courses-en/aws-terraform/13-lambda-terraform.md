# 13. Lambda in Terraform

## Function artifact

Lambda accepts:

| `package_type` | Source |
|---|---|
| `Zip` (default) | `filename` + `source_code_hash` |
| `Image` | ECR image URI |

For the course — **zip** with a Python handler.

## Building the zip

```bash
cd lambda
pip install -r requirements.txt -t package/
cp handler.py package/
cd package && zip -r ../lambda.zip .
```

Terraform tracks changes via a hash:

```hcl
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda/build"
  output_path = "${path.module}/lambda.zip"
}

resource "aws_lambda_function" "resize" {
  function_name = "${var.project}-resize"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "handler.main"
  runtime       = "python3.12"
  timeout       = 30
  memory_size   = 256

  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
}
```

Alternative: `archive_file` with `source_file` for a single `handler.py` without dependencies.

## CloudWatch Logs

```hcl
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.resize.function_name}"
  retention_in_days = 7
}
```

Create the log group **before** the first invoke or grant the IAM permission `logs:CreateLogGroup`.

## Environment variables

```hcl
environment {
  variables = {
    DYNAMODB_TABLE = aws_dynamodb_table.images.name
    THUMB_PREFIX   = "thumbs/"
  }
}
```

## Invoke from the CLI (LocalStack)

```bash
aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name course-resize \
  --payload '{"test": true}' \
  out.json && cat out.json
```

## Event source mapping (SQS)

For SQS — a separate resource `aws_lambda_event_source_mapping`; for S3 — `aws_s3_bucket_notification`.

## Checklist

- Why `source_code_hash`?
- How is the handler `handler.main` related to the file `handler.py`?
- Where does Lambda get credentials for S3/DynamoDB?

Next lesson: [14-lab-lambda-terraform.md](14-lab-lambda-terraform.md).
