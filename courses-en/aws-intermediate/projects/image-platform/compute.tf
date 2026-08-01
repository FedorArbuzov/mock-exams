resource "aws_cloudwatch_log_group" "worker" {
  name              = "/aws/lambda/${var.project}-worker"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/${var.project}-api"
  retention_in_days = 14
  tags              = var.tags
}

resource "aws_lambda_function" "worker" {
  function_name = "${var.project}-worker"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "handler.main"
  runtime       = "python3.12"
  timeout       = 60
  memory_size   = 512

  filename         = "${path.module}/lambda.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda.zip")

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.images.name
      THUMB_PREFIX   = "thumbs/"
    }
  }

  depends_on = [aws_cloudwatch_log_group.worker]

  tags = var.tags
}

resource "aws_lambda_function" "api" {
  function_name = "${var.project}-api"
  role          = aws_iam_role.lambda_exec.arn
  handler       = "api_handler.main"
  runtime       = "python3.12"
  timeout       = 15
  memory_size   = 256

  filename         = "${path.module}/lambda-api.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda-api.zip")

  environment {
    variables = {
      DYNAMODB_TABLE  = aws_dynamodb_table.images.name
      BUCKET_NAME     = aws_s3_bucket.images.id
      API_SECRET_ARN  = aws_secretsmanager_secret.api_key.arn
    }
  }

  depends_on = [aws_cloudwatch_log_group.api]

  tags = var.tags
}

resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn = aws_sqs_queue.work.arn
  function_name    = aws_lambda_function.worker.arn
  batch_size       = 5
  enabled          = true
}
