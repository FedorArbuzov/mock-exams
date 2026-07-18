# 13. Lambda в Terraform

## Артефакт функции

Lambda принимает:

| `package_type` | Источник |
|---|---|
| `Zip` (default) | `filename` + `source_code_hash` |
| `Image` | ECR image URI |

Для курса — **zip** с Python handler.

## Сборка zip

```bash
cd lambda
pip install -r requirements.txt -t package/
cp handler.py package/
cd package && zip -r ../lambda.zip .
```

Terraform отслеживает изменения через hash:

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

Альтернатива: `archive_file` с `source_file` для одного `handler.py` без зависимостей.

## CloudWatch Logs

```hcl
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.resize.function_name}"
  retention_in_days = 7
}
```

Создайте log group **до** первого invoke или дайте IAM право `logs:CreateLogGroup`.

## Environment variables

```hcl
environment {
  variables = {
    DYNAMODB_TABLE = aws_dynamodb_table.images.name
    THUMB_PREFIX   = "thumbs/"
  }
}
```

## Invoke из CLI (LocalStack)

```bash
aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name course-resize \
  --payload '{"test": true}' \
  out.json && cat out.json
```

## Event source mapping (SQS)

Для SQS — отдельный ресурс `aws_lambda_event_source_mapping`; для S3 — `aws_s3_bucket_notification`.

## Чек-лист

- Зачем `source_code_hash`?
- Чем handler `handler.main` связан с файлом `handler.py`?
- Где Lambda берёт credentials для S3/DynamoDB?

Следующий урок: [14-lab-lambda-terraform.md](14-lab-lambda-terraform.md).
