# 16. Лаба: DynamoDB table

## Задание 1. dynamodb.tf

Таблица `course-lab-images` с `image_id` (String), on-demand billing.

## Задание 2. output

```hcl
output "dynamodb_table_name" {
  value = aws_dynamodb_table.images.name
}
```

## Задание 3. put_item через CLI

```bash
aws --endpoint-url=http://localhost:4566 dynamodb put-item \
  --table-name course-lab-images \
  --item '{"image_id":{"S":"test-001"},"s3_key":{"S":"uploads/a.jpg"}}'

aws --endpoint-url=http://localhost:4566 dynamodb get-item \
  --table-name course-lab-images \
  --key '{"image_id":{"S":"test-001"}}'
```

## Задание 4. Расширить Lambda (опционально)

В handler добавьте `boto3.resource("dynamodb")` и `put_item` при invoke с телом `{"image_id": "manual-1"}`.

## Критерии успеха

- [ ] Table ACTIVE
- [ ] get-item возвращает запись
- [ ] destroy удаляет table

Следующий урок: [17-s3-lambda-pipeline.md](17-s3-lambda-pipeline.md).
