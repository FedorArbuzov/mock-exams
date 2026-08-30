output "bucket_name" {
  value = aws_s3_bucket.files.id
}

output "lambda_function_name" {
  value = aws_lambda_function.writer.function_name
}
