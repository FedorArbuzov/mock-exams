# 20. Лаба: алерт на ошибки Lambda

## Задание 1. SNS topic

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

Подтвердите subscription в почте (real AWS).

## Задание 2. Metric filter + alarm

Из [19-cloudwatch.md](19-cloudwatch.md) на worker Lambda log group.

## Задание 3. DLQ alarm

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

## Задание 4. Тест

Вызовите Lambda с ошибкой → проверьте alarm state `ALARM` (может занять 1–2 периода).

## Задание 5. Dashboard (бонус)

JSON dashboard с 3 виджетами: Invocations, Errors, DLQ depth.

## Критерии успеха

- [ ] ERROR в логах поднимает alarm
- [ ] Сообщение в DLQ поднимает dlq alarm
- [ ] SNS topic в state

Следующий урок: [21-security-ci.md](21-security-ci.md).
