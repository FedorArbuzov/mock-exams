# 18. Лаба: собрать pipeline вручную

Объедините уроки 10–16 в один каталог `~/aws-labs/lesson-18`.

## Задание 1. Структура

```text
lesson-18/
  versions.tf
  provider.tf
  variables.tf
  iam.tf
  s3.tf
  dynamodb.tf
  lambda.tf
  notification.tf
  lambda/handler.py
```

## Задание 2. handler.py (упрощённый)

Копируйте handler из [`projects/image-pipeline/lambda/handler.py`](projects/image-pipeline/lambda/handler.py) или реализуйте:

- читает S3 event;
- копирует объект в `thumbs/` (без Pillow);
- пишет `image_id`, `s3_key`, `thumb_key` в DynamoDB.

## Задание 3. notification.tf

`filter_prefix = "uploads/"`, `events = ["s3:ObjectCreated:*"]`, `depends_on` permission.

## Задание 4. E2E тест

```bash
tflocal apply
aws --endpoint-url=http://localhost:4566 s3 cp fixtures/sample.jpg s3://BUCKET/uploads/e2e.jpg
sleep 5
aws --endpoint-url=http://localhost:4566 s3 ls s3://BUCKET/thumbs/
aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name TABLE_NAME
```

**Что увидите:** объект в `thumbs/`, запись в DynamoDB.

## Задание 5. Отладка

Если Lambda не вызвалась:

```bash
docker compose -f deploy/localstack/docker-compose.yml logs localstack | tail -50
aws --endpoint-url=http://localhost:4566 lambda list-event-source-mappings
```

Проверьте permission и notification в Terraform state.

## Критерии успеха

- [ ] Upload в `uploads/` триггерит Lambda
- [ ] В `thumbs/` появился объект
- [ ] DynamoDB содержит metadata

Следующий урок: [19-modules.md](19-modules.md).
