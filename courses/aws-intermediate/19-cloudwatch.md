# 19. CloudWatch: логи, метрики, алерты

> Универсальные PromQL/Grafana/SLO — [observability-basic](../observability-basic/README.md) → [intermediate](../observability-intermediate/README.md) ([`deploy/observability`](../../deploy/observability/README.md)). Здесь — **AWS-native** observability.

## Логи

Lambda и ECS пишут в **CloudWatch Logs**:

```hcl
resource "aws_cloudwatch_log_group" "worker" {
  name              = "/aws/lambda/${aws_lambda_function.worker.function_name}"
  retention_in_days = 14
}
```

**Metric filter** на паттерн `ERROR`:

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

Нативная метрика SQS `ApproximateNumberOfMessagesVisible` на DLQ → alarm > 0.

## Dashboard

`aws_cloudwatch_dashboard` — виджеты: Lambda invocations, errors, DLQ depth, API 5xx (API Gateway metrics).

## X-Ray (кратко)

Включите `tracing_config { mode = "Active" }` на Lambda — trace через S3 → Lambda → DynamoDB.

## Чек-лист

- Где смотреть логи Lambda?
- Чем metric filter отличается от встроенной метрики Errors?
- Зачем SNS к alarm?
- Какая метрика SQS сигнализирует о poison messages?

Следующий урок: [20-lab-cloudwatch.md](20-lab-cloudwatch.md).
