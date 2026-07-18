# 10. Локальная эмуляция AWS: LocalStack и MiniStack

## Зачем эмулировать AWS

Курс и лабораторные не должны требовать **карту и риск счёта**. Локальный эмулятор даёт:

- Те же **API**, что ожидает Terraform и AWS CLI.
- Повторяемую среду на ноутбуке (Docker).
- Подготовку к **реальному AWS** без сюрпризов в биллинге.

## LocalStack

**Стандарт индустрии** для dev/test. Эмулирует **40+ сервисов** (S3, Lambda, DynamoDB, SQS, IAM, EC2 в упрощённом виде).

```bash
docker run --rm -p 4566:4566 -p 4510-4559:4510-4559 localstack/localstack
```

| Плюсы | Минусы |
|---|---|
| Большое комьюнити, документация | Требовательен к RAM (~500MB+) |
| Интеграция с `tflocal` | Pro-фичи платные |
| Паритет с Terraform/AWS CLI | Не 100% как production AWS |

**Endpoint по умолчанию:** `http://localhost:4566`

## MiniStack

**MIT**, лёгкий (~30MB RAM), **41 сервис**, порт тот же `4566`.

```bash
docker run --rm -p 4566:4566 ministackorg/ministack
```

| Плюсы | Минусы |
|---|---|
| Бесплатно полностью | Меньше комьюнити |
| Быстрый старт | Моложе проекта (2025+) |

Для курса оба подходят; выберите один и зафиксируйте в README лаб.

## Настройка AWS CLI

```bash
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

aws --endpoint-url=http://localhost:4566 s3 mb s3://my-course-bucket-123
aws --endpoint-url=http://localhost:4566 s3 ls
```

## Terraform: provider endpoints

Без `tflocal` — явно указать endpoints:

```hcl
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true

  endpoints {
    s3         = "http://localhost:4566"
    dynamodb   = "http://localhost:4566"
    lambda     = "http://localhost:4566"
    sqs        = "http://localhost:4566"
    iam        = "http://localhost:4566"
  }
}
```

Для S3 в LocalStack иногда нужен:

```hcl
s3_use_path_style = true
```

(в provider `aws` или через `tflocal`, который подставляет сам).

## tflocal — один код для local и cloud

```bash
pip install terraform-local
tflocal init
tflocal apply
```

**`tflocal`** оборачивает `terraform` и автоматически настраивает endpoints под LocalStack. Код `.tf` для уроков можно держать **без** hardcode `localhost` в репозитории — студент выбирает `terraform apply` vs `tflocal apply`.

## Ограничения эмуляции

| В production | В эмуляторе |
|---|---|
| Multi-AZ RDS failover | Упрощено или нет |
| Реальная latency / limits | Другое |
| Все edge cases IAM | Частично |
| CloudFront, некоторые сервисы | Нет или stub |

**Правило:** после курса один раз прогоните критичный сценарий в **реальном** dev-account с budget alert.

## Финальный проект (preview)

Архитектура для курса `aws-terraform` (следующий трек):

```text
[Client]
    → presigned PUT → S3 bucket (uploads/)
    → S3 event → Lambda (resize)
        → S3 (thumbs/)
        → DynamoDB (metadata)
    → optional: SQS DLQ при ошибках Lambda
```

Всё разворачивается через Terraform на LocalStack/MiniStack.

## Docker Compose (опционально для репозитория)

Позже можно добавить `deploy/localstack/docker-compose.yml` в репозиторий — один `docker compose up` для всего класса.

## Чек-лист

- На каком порту слушает LocalStack?
- Зачем `skip_credentials_validation`?
- Чем `tflocal apply` отличается от `terraform apply`?
- Назовите 3 ограничения эмулятора.
- Какой endpoint для `aws s3 ls` локально?

---

**Теория aws-basic завершена.** Дальше — курс [aws-terraform](../aws-terraform/README.md).
