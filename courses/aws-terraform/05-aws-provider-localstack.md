# 05. Провайдер AWS и endpoints для LocalStack

## Провайдер hashicorp/aws

Плагин общается с **AWS API**. Для LocalStack те же вызовы уходят на `http://localhost:4566`.

Ключевые настройки для эмуляции:

| Параметр | Зачем |
|---|---|
| `access_key` / `secret_key` | Любые (`test`/`test`) |
| `skip_credentials_validation` | Не ходить в реальный STS |
| `skip_requesting_account_id` | Не запрашивать account id |
| `skip_metadata_api_check` | Нет EC2 metadata на ноутбуке |
| `s3_use_path_style = true` | S3 path-style URLs для LocalStack |
| `endpoints { ... }` | Подмена URL сервисов |

## Полный блок endpoints

```hcl
provider "aws" {
  region = var.aws_region

  access_key                  = var.aws_access_key
  secret_key                  = var.aws_secret_key
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
  s3_use_path_style           = true

  endpoints {
    s3       = var.localstack_endpoint
    dynamodb = var.localstack_endpoint
    lambda   = var.localstack_endpoint
    iam      = var.localstack_endpoint
    sqs      = var.localstack_endpoint
    sts      = var.localstack_endpoint
    logs     = var.localstack_endpoint
  }
}
```

Не все сервисы нужны в каждом проекте — добавляйте по мере использования.

## Переключение local ↔ real AWS

Паттерн **без** дублирования `.tf`:

```hcl
variable "use_localstack" {
  type    = bool
  default = true
}

provider "aws" {
  region = var.aws_region

  dynamic "endpoints" {
    for_each = var.use_localstack ? [1] : []
    content {
      s3       = var.localstack_endpoint
      dynamodb = var.localstack_endpoint
      lambda   = var.localstack_endpoint
      iam      = var.localstack_endpoint
    }
  }

  # для real AWS — credentials из env AWS_PROFILE / IAM role
  access_key = var.use_localstack ? "test" : null
  secret_key = var.use_localstack ? "test" : null
  skip_credentials_validation = var.use_localstack
  skip_requesting_account_id  = var.use_localstack
  s3_use_path_style           = var.use_localstack
}
```

`prod.tfvars`: `use_localstack = false`.

## Docker Compose из репозитория

```yaml
# deploy/localstack/docker-compose.yml
services:
  localstack:
    image: localstack/localstack:latest
    ports:
      - "4566:4566"
    environment:
      - SERVICES=s3,lambda,dynamodb,iam,sqs,sts,logs
```

`LAMBDA_EXECUTOR=docker` — Lambda в LocalStack запускает контейнеры (нужен Docker socket).

## MiniStack

Тот же порт `4566`, те же endpoints. Замените image в compose или:

```bash
docker run --rm -p 4566:4566 ministackorg/ministack
```

## Ограничения

- Не каждый resource type работает одинаково (особенно VPC, RDS).
- Версии провайдера AWS и версия LocalStack должны быть совместимы — при странных ошибках проверьте [LocalStack docs](https://docs.localstack.cloud/).

## Чек-лист

- Зачем `s3_use_path_style`?
- Какие `skip_*` нужны только для LocalStack?
- Как один `.tf` переключить на prod?

Следующий урок: [06-lab-aws-provider-localstack.md](06-lab-aws-provider-localstack.md).
