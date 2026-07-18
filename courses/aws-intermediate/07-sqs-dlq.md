# 07. SQS, DLQ и backpressure

## Зачем очередь между S3 и Lambda

Прямой **S3 → Lambda** ломается при всплеске загрузок:

- Lambda concurrency limit
- Timeout при пакетной загрузке
- Сложно повторить обработку одного файла

```text
S3 upload
    → (notification) → SQS queue
    → Lambda event source mapping (batch)
    → success: delete message
    → fail N раз → DLQ
```

## SQS типы

| Очередь | Гарантии | Курс |
|---|---|---|
| Standard | at-least-once, порядок не гарантирован | ✅ default |
| FIFO | ordering + dedup | отдельные `.fifo` имена |

## Dead Letter Queue (DLQ)

```hcl
resource "aws_sqs_queue" "dlq" {
  name = "${var.project}-images-dlq"
}

resource "aws_sqs_queue" "work" {
  name = "${var.project}-images-work"

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dlq.arn
    maxReceiveCount     = 3
  })
}
```

После **3** неудачных обработок сообщение уходит в DLQ для ручного разбора.

## Lambda event source mapping

```hcl
resource "aws_lambda_event_source_mapping" "sqs" {
  event_source_arn = aws_sqs_queue.work.arn
  function_name    = aws_lambda_function.worker.arn
  batch_size       = 5
  enabled          = true

  function_response_types = ["ReportBatchItemFailures"]
}
```

**Partial batch failure** — только failed messages возвращаются в очередь (важно для идемпотентности).

## Идемпотентность

SQS Standard может доставить **дубликат**. Handler:

- ключ `image_id` детерминирован из s3 key, или
- conditional write в DynamoDB.

## Мониторинг

- `ApproximateNumberOfMessagesVisible` на DLQ → alarm.
- CloudWatch metric для queue depth.

## Чек-лист

- Зачем SQS между S3 и Lambda?
- Что делает `maxReceiveCount`?
- Почему handler должен быть идемпотентным?
- Что такое partial batch failure?

Следующий урок: [08-lab-sqs-dlq.md](08-lab-sqs-dlq.md).
