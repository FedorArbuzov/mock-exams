# 20. Lab: alert on Lambda errors

## Task 1. SNS topic

```hcl
resource "aws_sns_topic" "alerts" {
  name = "${var.project}-alerts"
}

resource "aws_sns_topic_subscription" "email" {
  count     = var.alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}
```

Confirm the subscription in email (real AWS).

## Task 2. Metric filter + alarm

From [19-cloudwatch.md](19-cloudwatch.md) on the worker Lambda log group.

## Task 3. DLQ alarm

```hcl
resource "aws_cloudwatch_metric_alarm" "dlq_messages" {
  alarm_name          = "${var.project}-dlq-not-empty"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ApproximateNumberOfMessagesVisible"
  namespace           = "AWS/SQS"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  dimensions = {
    QueueName = aws_sqs_queue.dlq.name
  }
  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

## Task 4. Test

Invoke Lambda with an error → check alarm state `ALARM` (may take 1–2 periods).

## Task 5. Dashboard (bonus)

JSON dashboard with 3 widgets: Invocations, Errors, DLQ depth.

## Success criteria

- [ ] ERROR in logs raises the alarm
- [ ] A message in the DLQ raises the dlq alarm
- [ ] SNS topic in state

Next lesson: [21-security-ci.md](21-security-ci.md).
