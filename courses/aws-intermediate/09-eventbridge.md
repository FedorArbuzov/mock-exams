# 09. EventBridge: шина событий

## EventBridge vs SNS vs SQS

| Сервис | Модель | Когда |
|---|---|---|
| **SNS** | Fan-out push | Уведомления, несколько подписчиков |
| **SQS** | Очередь pull | Буфер, workers |
| **EventBridge** | Event bus + rules + фильтры | Доменные события, routing, schedule |

## Event bus

- **default** bus — события от AWS сервисов (S3 через EventBridge, EC2 state change).
- **custom** bus — ваши приложения публикуют `source`, `detail-type`, `detail`.

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

В bucket включите `eventbridge = true` в notification configuration, затем rule на `aws.s3` / `Object Created`.

## Scheduler

EventBridge **Scheduler** заменяет CloudWatch Events cron для новых проектов — `rate(5 minutes)` → Lambda housekeeping.

## Чек-лист

- Чем custom bus отличается от default?
- Зачем `event_pattern`?
- Почему нужен `lambda_permission` для EventBridge?
- Когда EventBridge лучше прямого S3→Lambda?

Следующий урок: [10-lab-eventbridge.md](10-lab-eventbridge.md).
