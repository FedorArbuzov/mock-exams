# 10. Лаба: EventBridge в pipeline

## Задание 1. Custom event bus

```hcl
resource "aws_cloudwatch_event_bus" "app" {
  name = "${var.project}-bus"
}
```

## Задание 2. S3 → EventBridge

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

На LocalStack паттерн может отличаться — сверяйте `detail` в логах первого события.

## Задание 3. Target → SQS (decoupling)

Вместо прямого Lambda:

```hcl
resource "aws_cloudwatch_event_target" "to_sqs" {
  rule           = aws_cloudwatch_event_rule.s3_upload.name
  arn            = aws_sqs_queue.work.arn
  event_bus_name = "default"
  sqs_target {}
}
```

+ IAM policy на SQS для `events.amazonaws.com`.

## Задание 4. Цепочка

```text
S3 → EventBridge → SQS → Lambda worker
```

Сравните с лабой 08 (S3→SQS напрямую): EventBridge даёт **фильтрацию** и несколько targets.

## Критерии успеха

- [ ] Upload триггерит событие
- [ ] Rule срабатывает (по метрикам или логам)
- [ ] Worker получает работу через SQS

Следующий урок: [11-secrets-kms.md](11-secrets-kms.md).
