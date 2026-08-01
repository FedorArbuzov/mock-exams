output "bucket_name" {
  value = aws_s3_bucket.images.id
}

output "api_endpoint" {
  value = aws_apigatewayv2_api.http.api_endpoint
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.images.name
}

output "sqs_work_queue_url" {
  value = aws_sqs_queue.work.url
}

output "dlq_queue_url" {
  value = aws_sqs_queue.dlq.url
}

output "vpc_id" {
  value = aws_vpc.main.id
}
