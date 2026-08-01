resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${var.project}-resize"
  retention_in_days = 7
  tags              = var.tags
}

resource "aws_lambda_function" "resize" {
  function_name = "${var.project}-resize"
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

  depends_on = [aws_cloudwatch_log_group.lambda]

  tags = var.tags
}

resource "aws_lambda_permission" "allow_s3" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.resize.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.images.arn
}
