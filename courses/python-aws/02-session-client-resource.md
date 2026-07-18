# 02. Session, client vs resource

## Введение: «два способа положить объект в S3 — какой правильный?»

Junior копирует snippet с `s3.meta.client.upload_file` и snippet с `s3.put_object`. Оба работают. Senior спрашивает: **client или resource?** Session один на процесс или на каждый вызов? Неправильный выбор — лишние connection pools и inconsistent region.

Эта глава — **объектная модель boto3** на примере [`shop_aws/clients.py`](../../deploy/python-aws/stack/shop_aws/clients.py).

## Что вы узнаете

- Что такое `boto3.Session` и зачем переиспользовать.
- **Low-level client** vs **high-level resource**.
- Когда в стеке курса смешивают оба (DynamoDB).

---

## Иерархия boto3

```text
boto3.Session(credentials, region)
    ├── .client("s3")      → dict-like API, 1:1 с AWS API
    └── .resource("s3")      → object-oriented wrappers
            └── .Bucket(name)
                    └── .upload_file(...)
```

**botocore** под капотом — один HTTP session pool на client.

---

## Session

```python
import boto3

session = boto3.Session(
    aws_access_key_id="test",
    aws_secret_access_key="test",
    region_name="us-east-1",
)

s3_client = session.client("s3", endpoint_url="http://localhost:4566")
s3_resource = session.resource("s3", endpoint_url="http://localhost:4566")
```

| Параметр Session | Источник по умолчанию |
|------------------|----------------------|
| `aws_access_key_id` | env `AWS_ACCESS_KEY_ID` |
| `aws_secret_access_key` | env `AWS_SECRET_ACCESS_KEY` |
| `region_name` | env `AWS_DEFAULT_REGION` |
| profile | env `AWS_PROFILE` → `~/.aws/credentials` |

**Best practice:** одна factory на приложение (как `boto_session()` в стеке), не `boto3.client()` в каждой функции — иначе лишние connection pools.

Стек курса:

```python
def boto_session() -> boto3.Session:
    return boto3.Session(
        aws_access_key_id=settings.access_key,
        aws_secret_access_key=settings.secret_key,
        region_name=settings.region,
    )
```

---

## Client (low-level)

```python
from shop_aws.clients import client

s3 = client("s3")
s3.put_object(Bucket="shop-uploads", Key="photo.jpg", Body=b"...")
resp = s3.get_object(Bucket="shop-uploads", Key="photo.jpg")
body = resp["Body"].read()
```

| Плюсы | Минусы |
|-------|--------|
| Полное покрытие API | Verbose |
| Точные имена операций AWS docs | Streaming вручную |
| Paginators, waiters | |

`S3Service` в стеке — **только client** — явный контроль над `put_object`, `list_objects_v2`.

---

## Resource (high-level)

```python
from shop_aws.clients import resource

s3 = resource("s3")
bucket = s3.Bucket("shop-uploads")
for obj in bucket.objects.filter(Prefix="orders/"):
    print(obj.key)

table = resource("dynamodb").Table("shop-items")
table.put_item(Item={"pk": "item:1", "name": "Widget"})
```

| Плюсы | Минусы |
|-------|--------|
| Pythonic collections | Не все API доступны |
| `Table.put_item` короче | Скрывает response details |
| Batch helpers (`batch_writer`) | Extra abstraction layer |

`DynamoDBRepository` использует **client** для `create_table` + **resource** для `put_item` — типичный hybrid.

---

## Client vs resource: decision table

| Задача | Выбор |
|--------|-------|
| `put_object` / `get_object` | client (как S3Service) |
| Multipart upload low-level | client |
| Iterate `bucket.objects` | resource |
| `Table.get_item` | resource удобнее |
| `transact_write_items` | client only |
| Lambda cold start | один client, lazy init |

---

## Endpoint URL (LocalStack)

```python
def client(service: str):
    kwargs = {}
    if settings.endpoint_url:
        kwargs["endpoint_url"] = settings.endpoint_url
    return boto_session().client(service, **kwargs)
```

Без `endpoint_url` boto3 идёт в **реальный AWS** для указанного region. Опасная ошибка — забыть env локально и случайно hit production.

---

## Thread safety и Lambda

| Context | Рекомендация |
|---------|--------------|
| FastAPI / Django | module-level client или `@lru_cache` factory |
| Celery worker | один client на process |
| Lambda | init outside handler — reuse |

Clients **thread-safe** для read operations; для write — документация сервиса (S3 — ok).

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| `boto3.client("s3")` без Session в app | inconsistent region |
| Resource для операции без wrapper | `AttributeError` |
| Не закрыть `Body` stream | connection leak (редко) |
| Два Session с разными keys | intermittent auth errors |

## Резюме

**Session** — credentials + region. **Client** — полный AWS API, dict responses. **Resource** — удобные объекты. Стек курса: S3 через client, DynamoDB — hybrid. Всегда centralize factory.

Далее: [03-lab-explore-localstack](03-lab-explore-localstack.md).
