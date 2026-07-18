# 04. Config: endpoints, credentials, regions

## Введение: «работает в Docker, падает на ноутбуке — endpoint_url»

Разработчик запускает скрипт на хосте без `AWS_ENDPOINT_URL`. boto3 идёт в **real AWS** → `NoSuchBucket` или хуже — пишет в **production bucket**. Другая классика — region `eu-west-1` в коде, bucket в `us-east-1`.

Конфигурация AWS SDK — **12-factor**: всё через env. Эталон: [`shop_aws/config.py`](../../deploy/python-aws/stack/shop_aws/config.py).

## Что вы узнаете

- Credential chain boto3 и dummy keys для LocalStack.
- `endpoint_url` — когда и как.
- Region, resource names, pydantic-settings pattern.

---

## Переменные окружения (стенд)

| Env var | Default (lab) | Назначение |
|---------|---------------|------------|
| `AWS_ENDPOINT_URL` | `http://localhost:4566` | LocalStack gateway |
| `AWS_ACCESS_KEY_ID` | `test` | access key |
| `AWS_SECRET_ACCESS_KEY` | `test` | secret key |
| `AWS_DEFAULT_REGION` | `us-east-1` | region |
| `SHOP_BUCKET` | `shop-uploads` | имя bucket |
| `SHOP_TABLE` | `shop-items` | DynamoDB table |
| `SHOP_QUEUE` | `shop-events` | SQS queue |

В Docker Compose lab container получает `http://localstack:4566` (hostname внутри network). С **хоста** — `http://localhost:4566`.

---

## Settings class

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(extra="ignore")

    endpoint_url: str | None = Field(
        default="http://localhost:4566",
        validation_alias="AWS_ENDPOINT_URL",
    )
    region: str = Field(default="us-east-1", validation_alias="AWS_DEFAULT_REGION")
    access_key: str = Field(default="test", validation_alias="AWS_ACCESS_KEY_ID")
    secret_key: str = Field(default="test", validation_alias="AWS_SECRET_ACCESS_KEY")
    shop_bucket: str = Field(default="shop-uploads", validation_alias="SHOP_BUCKET")
```

| Паттерн | Зачем |
|---------|-------|
| `validation_alias` | стандартные AWS env names |
| `extra="ignore"` | не падать на лишние vars |
| `endpoint_url: str \| None` | `None` = real AWS |

---

## Credential resolution order

boto3 проверяет (упрощённо):

1. Явные аргументы `Session(...)`
2. Env vars `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
3. `AWS_PROFILE` → shared credentials file
4. **IAM role** (EC2 instance profile, ECS task role, Lambda execution role)
5. SSO / Web identity

LocalStack принимает **любые** non-empty keys — `test`/`test` достаточно. Production: **никогда** long-lived keys в коде — только role.

---

## endpoint_url per service

```python
def client(service: str):
    kwargs = {}
    if settings.endpoint_url:
        kwargs["endpoint_url"] = settings.endpoint_url
    return boto_session().client(service, **kwargs)
```

LocalStack — **single gateway** `:4566` для всех сервисов. В real AWS `endpoint_url` **не задают**.

| Среда | endpoint_url |
|-------|--------------|
| LocalStack host | `http://localhost:4566` |
| LocalStack docker lab | `http://localstack:4566` |
| AWS prod | `None` |

---

## Region matters

| Ошибка | Причина |
|--------|---------|
| `PermanentRedirect` | bucket в другом region |
| `ResourceNotFoundException` | table в другом region |
| Signature mismatch | clock skew / wrong region |

S3 bucket names **global**; DynamoDB/SQS — **regional**. Session `region_name` должен совпадать с ресурсом.

---

## Resource naming

Приложение **не создаёт** bucket в prod на каждый request — читает имя из env:

```python
self.bucket = settings.shop_bucket  # SHOP_BUCKET
```

Terraform/CDK создаёт ресурс → CI injects env → app использует boto3. Bootstrap в labs — исключение для local dev.

---

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| Hardcode `localhost:4566` в коде | CI/docker hostname break |
| Забыть unset endpoint в prod | latency / wrong routing |
| Один bucket name для dev/prod | data leak |
| Commit `.env` с real keys | security incident |

## Резюме

**Env-driven config** — стандарт для boto3. LocalStack: dummy creds + `endpoint_url`. Production: IAM roles, no endpoint override. Centralize в `Settings` + factory `clients.py`.

Далее: [05-lab-first-boto3-call](05-lab-first-boto3-call.md).
