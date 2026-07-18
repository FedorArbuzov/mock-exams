# 08. Лаба: S3 → SQS → Lambda

## Задание 1. Очереди

```hcl
resource "aws_sqs_queue" "dlq" {
  name = "${var.project}-dlq"
}

resource "aws_sqs_queue" "work" {
  name = "${var.project}-work"
  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
}
```

## Задание 2. S3 → SQS notification

```hcl
resource "aws_s3_bucket_notification" "to_sqs" {
  bucket = aws_s3_bucket.images.id

  queue {
    queue_arn     = aws_sqs_queue.work.arn
    events        = ["s3:ObjectCreated:*"]
    filter_prefix = "uploads/"
  }
}

resource "aws_sqs_queue_policy" "allow_s3" {
  queue_url = aws_sqs_queue.work.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "s3.amazonaws.com" }
      Action    = "sqs:SendMessage"
      Resource  = aws_sqs_queue.work.arn
      Condition = {
        ArnEquals = { "aws:SourceArn" = aws_s3_bucket.images.arn }
      }
    }]
  })
}
```

Уберите прямой `lambda_function` block из bucket notification (урок aws-terraform).

## Задание 3. Worker Lambda

Handler читает SQS records, парсит S3 event из body, вызывает логику resize (из image-pipeline).

```hcl
resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn = aws_sqs_queue.work.arn
  function_name    = aws_lambda_function.worker.arn
  batch_size       = 5
}
```

IAM: `sqs:ReceiveMessage`, `DeleteMessage`, `GetQueueAttributes` на work queue.

## Задание 4. E2E

```bash
aws --endpoint-url=http://localhost:4566 s3 cp test.jpg s3://BUCKET/uploads/q.jpg
# подождать
aws --endpoint-url=http://localhost:4566 sqs get-queue-attributes \
  --queue-url $(aws ... get-queue-url --queue-name PROJECT-work) \
  --attribute-names ApproximateNumberOfMessages
```

## Задание 5. Симуляция ошибки

Временно `raise Exception` в handler → после 3 попыток сообщение в DLQ.

## Критерии успеха

- [ ] Upload не вызывает Lambda напрямую
- [ ] Worker обрабатывает из SQS
- [ ] DLQ получает poison message после ошибок

Следующий урок: [09-eventbridge.md](09-eventbridge.md).
