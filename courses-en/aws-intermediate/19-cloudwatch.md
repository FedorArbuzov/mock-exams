# 19. CloudWatch: logs, metrics, alerts

> Universal PromQL/Grafana/SLO — [observability-basic](../observability-basic/README.md) → [intermediate](../observability-intermediate/README.md) ([`deploy/observability`](../../deploy/observability/README.md)). Here — **AWS-native** observability.

## Logs

Lambda and ECS write to **CloudWatch Logs**:

```hcl
resource "aws_cloudwatch_log_group" "worker" {
  name              = "/aws/lambda/${aws_lambda_function.worker.function_name}"
  retention_in_days = 14
}
```

**Metric filter** on the `ERROR` pattern:

```hcl
resource "aws_cloudwatch_log_metric_filter" "errors" {
  name           = "${var.project}-lambda-errors"
  log_group_name = aws_cloudwatch_log_group.worker.name
  pattern        = "ERROR"

  metric_transformation {
    name      = "LambdaErrorCount"
    namespace = "Course/ImagePlatform"
    value     = "1"
  }
}
```

## Alarm

```hcl
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "LambdaErrorCount"
  namespace           = "Course/ImagePlatform"
  period              = 60
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Lambda logged ERROR"
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

## DLQ depth

Native SQS metric `ApproximateNumberOfMessagesVisible` on the DLQ → alarm > 0.

## Dashboard

`aws_cloudwatch_dashboard` — widgets: Lambda invocations, errors, DLQ depth, API 5xx (API Gateway metrics).

## X-Ray (brief)

Enable `tracing_config { mode = "Active" }` on Lambda — trace through S3 → Lambda → DynamoDB.

## Checklist

- Where do you look at Lambda logs?
- How does a metric filter differ from the built-in Errors metric?
- Why SNS on an alarm?
- Which SQS metric signals poison messages?

Next lesson: [20-lab-cloudwatch.md](20-lab-cloudwatch.md).
