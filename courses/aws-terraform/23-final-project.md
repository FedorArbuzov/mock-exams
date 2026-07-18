# 23. Финальный проект: Image Pipeline

## Цель

Развернуть на LocalStack **event-driven** приложение:

1. Пользователь загружает JPEG в `s3://.../uploads/`.
2. S3 вызывает Lambda.
3. Lambda создаёт уменьшенную копию в `thumbs/` и пишет метаданные в DynamoDB.

Всё — **Terraform**, без ручного Console.

## Архитектура

```text
                    ┌─────────────────┐
                    │  S3 bucket      │
                    │  uploads/*      │
                    └────────┬────────┘
                             │ ObjectCreated
                             ▼
                    ┌─────────────────┐
                    │  Lambda resize  │
                    └────────┬────────┘
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        S3 thumbs/*    DynamoDB table   CloudWatch Logs
```

## Эталонное решение

Каталог: [`projects/image-pipeline/`](projects/image-pipeline/).

```bash
# 1. LocalStack
docker compose -f deploy/localstack/docker-compose.yml up -d

# 2. Сборка Lambda (Pillow)
cd courses/aws-terraform/projects/image-pipeline
./scripts/build-lambda.sh    # или build-lambda.ps1 на Windows

# 3. Apply
tflocal init
tflocal apply -var="bucket_name=course-final-YOURNAME"

# 4. Тест
aws --endpoint-url=http://localhost:4566 s3 cp test.jpg \
  s3://course-final-YOURNAME/uploads/test.jpg

aws --endpoint-url=http://localhost:4566 s3 ls \
  s3://course-final-YOURNAME/thumbs/

aws --endpoint-url=http://localhost:4566 dynamodb scan \
  --table-name course-images
```

## Требования (самостоятельная реализация)

Если делаете с нуля, а не форк эталона:

| # | Требование |
|---|---|
| 1 | S3: encryption, block public access |
| 2 | DynamoDB: on-demand, ключ `image_id` |
| 3 | IAM: least privilege для S3 + DynamoDB + logs |
| 4 | Lambda: Python 3.12, env `DYNAMODB_TABLE`, `THUMB_PREFIX` |
| 5 | S3 notification только на `uploads/` + `.jpg` (или `.jpeg`) |
| 6 | `aws_lambda_permission` для S3 |
| 7 | README с командами apply/destroy/test |

## Бонус

- [ ] Presigned URL для upload (скрипт Python/CLI).
- [ ] SQS DLQ для failed Lambda.
- [ ] Модуль `modules/s3-bucket` переиспользован.
- [ ] GitHub Actions plan в PR.

## Сдача

Репозиторий или gist с:

- `.tf` файлами
- `lambda/handler.py`
- скрин или лог успешного `scan` DynamoDB после upload

## Переход на реальный AWS

1. `use_localstack = false` в tfvars.
2. `AWS_PROFILE` с правами на S3/Lambda/DynamoDB/IAM.
3. **Budget alert** $5–10.
4. Уникальный `bucket_name` (глобально).

## Чек-лист

- [ ] Pipeline работает end-to-end на LocalStack
- [ ] `tflocal destroy` очищает ресурсы
- [ ] Понимаете порядок: IAM → Lambda → permission → notification

Поздравляем — трек **aws-basic + aws-terraform** завершён.
