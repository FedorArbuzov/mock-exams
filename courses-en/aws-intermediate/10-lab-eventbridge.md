# 10. Lab: EventBridge in the pipeline

## Task 1. Custom event bus

```hcl
resource "aws_cloudwatch_event_bus" "app" {
  name = "${var.project}-bus"
}
```

## Task 2. S3 → EventBridge

```hcl
resource "aws_s3_bucket_notification" "eventbridge" {
  bucket      = aws_s3_bucket.images.id
  eventbridge = true
}

resource "aws_cloudwatch_event_rule" "s3_upload" {
  name           = "${var.project}-s3-upload"
  event_bus_name = "default"
  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["Object Created"]
    detail = {
      bucket = { name = [aws_s3_bucket.images.bucket] }
      object = { key = [{ prefix = "uploads/" }] }
    }
  })
}
```

On LocalStack the pattern may differ — check `detail` in the logs of the first event.

## Task 3. Target → SQS (decoupling)

Instead of Lambda directly:

```hcl
resource "aws_cloudwatch_event_target" "to_sqs" {
  rule           = aws_cloudwatch_event_rule.s3_upload.name
  arn            = aws_sqs_queue.work.arn
  event_bus_name = "default"
  sqs_target {}
}
```

+ IAM policy on SQS for `events.amazonaws.com`.

## Task 4. Chain

```text
S3 → EventBridge → SQS → Lambda worker
```

Compare with lab 08 (S3→SQS directly): EventBridge gives you **filtering** and multiple targets.

## Success criteria

- [ ] Upload triggers an event
- [ ] Rule fires (via metrics or logs)
- [ ] Worker gets work via SQS

Next lesson: [11-secrets-kms.md](11-secrets-kms.md).
