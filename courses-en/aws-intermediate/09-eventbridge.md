# 09. EventBridge: event bus

## EventBridge vs SNS vs SQS

| Service | Model | When |
|---|---|---|
| **SNS** | Fan-out push | Notifications, multiple subscribers |
| **SQS** | Pull queue | Buffer, workers |
| **EventBridge** | Event bus + rules + filters | Domain events, routing, schedule |

## Event bus

- **default** bus — events from AWS services (S3 via EventBridge, EC2 state change).
- **custom** bus — your apps publish `source`, `detail-type`, `detail`.

```json
{
  "source": "course.images",
  "detail-type": "ImageUploaded",
  "detail": {
    "bucket": "my-bucket",
    "key": "uploads/a.jpg"
  }
}
```

## Rule

```hcl
resource "aws_cloudwatch_event_rule" "image_uploaded" {
  name           = "${var.project}-image-uploaded"
  event_bus_name = aws_cloudwatch_event_bus.app.name
  event_pattern = jsonencode({
    source      = ["course.images"]
    detail-type = ["ImageUploaded"]
  })
}

resource "aws_cloudwatch_event_target" "to_lambda" {
  rule           = aws_cloudwatch_event_rule.image_uploaded.name
  event_bus_name = aws_cloudwatch_event_bus.app.name
  arn            = aws_lambda_function.worker.arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.worker.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.image_uploaded.arn
}
```

## S3 → EventBridge

On the bucket enable `eventbridge = true` in the notification configuration, then a rule on `aws.s3` / `Object Created`.

## Scheduler

EventBridge **Scheduler** replaces CloudWatch Events cron for new projects — `rate(5 minutes)` → Lambda housekeeping.

## Checklist

- How does a custom bus differ from default?
- Why `event_pattern`?
- Why do you need `lambda_permission` for EventBridge?
- When is EventBridge better than direct S3→Lambda?

Next lesson: [10-lab-eventbridge.md](10-lab-eventbridge.md).
