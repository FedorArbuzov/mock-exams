# 08. Lab: S3 → SQS → Lambda

## Task 1. Queues

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

## Task 2. S3 → SQS notification

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

Remove the direct `lambda_function` block from the bucket notification (aws-terraform lesson).

## Task 3. Worker Lambda

Handler reads SQS records, parses the S3 event from the body, runs resize logic (from image-pipeline).

```hcl
resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn = aws_sqs_queue.work.arn
  function_name    = aws_lambda_function.worker.arn
  batch_size       = 5
}
```

IAM: `sqs:ReceiveMessage`, `DeleteMessage`, `GetQueueAttributes` on the work queue.

## Task 4. E2E

```bash
aws --endpoint-url=http://localhost:4566 s3 cp test.jpg s3://BUCKET/uploads/q.jpg
# wait
aws --endpoint-url=http://localhost:4566 sqs get-queue-attributes \
  --queue-url $(aws ... get-queue-url --queue-name PROJECT-work) \
  --attribute-names ApproximateNumberOfMessages
```

## Task 5. Simulating an error

Temporarily `raise Exception` in the handler → after 3 attempts the message lands in the DLQ.

## Success criteria

- [ ] Upload does not invoke Lambda directly
- [ ] Worker processes from SQS
- [ ] DLQ receives the poison message after failures

Next lesson: [09-eventbridge.md](09-eventbridge.md).
