# 17. Pipeline: S3 → Lambda → DynamoDB

## Архитектура

```text
Client
  │  PUT uploads/photo.jpg
  ▼
S3 bucket
  │  ObjectCreated event
  ▼
Lambda (resize + metadata)
  ├── PUT thumbs/photo.jpg  → S3
  └── PutItem               → DynamoDB
```

## Поток события S3

S3 передаёт Lambda batch records:

```json
{
  "Records": [{
    "s3": {
      "bucket": { "name": "my-bucket" },
      "object": { "key": "uploads/photo.jpg", "size": 12345 }
    }
  }]
}
```

Handler должен:

1. Декодировать key (URL encoding: `+` → пробел).
2. Скачать объект (`get_object`).
3. Обработать (resize или copy в учебной версии).
4. Записать thumb и metadata.
5. Идемпотентность: повторное событие не должно ломать данные.

## Terraform-порядок apply

```text
1. IAM role + policies
2. S3 bucket + public block + encryption
3. DynamoDB table
4. Lambda function + log group
5. aws_lambda_permission (S3 → Lambda)
6. aws_s3_bucket_notification
```

## DLQ (опционально)

При ошибке Lambda — **Dead Letter Queue** (SQS):

```hcl
resource "aws_lambda_function" "resize" {
  # ...
  dead_letter_config {
    target_arn = aws_sqs_queue.dlq.arn
  }
}
```

+ IAM на отправку в SQS.

## Ограничения LocalStack

- Холодный старт Lambda в Docker может быть медленным.
- Pillow в Lambda на LocalStack — соберите zip локально ([projects/image-pipeline](projects/image-pipeline/)).
- Некоторые фильтры notification работают иначе — тестируйте на реальном AWS перед prod.

## Чек-лист

- Зачем `aws_lambda_permission` перед notification?
- Какие prefix/suffix ограничить для uploads?
- Почему handler должен быть идемпотентным?

Следующий урок: [18-lab-s3-lambda-pipeline.md](18-lab-s3-lambda-pipeline.md).
