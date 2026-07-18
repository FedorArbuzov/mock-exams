# 06. Errors, retries, paginators

## Введение: «list_objects вернул 1000 ключей — где остальные?»

Скрипт migration listing S3 bucket — первые 1000 keys ok, дальше **тишина**. Другой кейс: transient `503` от DynamoDB — без retry скрипт падает на половине batch. boto3 **умеет** retry и paginate — если вы вызываете API правильно.

## Что вы узнаете

- `ClientError` и `Error` dict из response.
- Встроенные **retries** botocore (standard mode).
- **Paginators** для list/query операций.

---

## ClientError

```python
from botocore.exceptions import ClientError

try:
    s3.get_object(Bucket="shop-uploads", Key="missing.txt")
except ClientError as e:
    code = e.response["Error"]["Code"]
    status = e.response["ResponseMetadata"]["HTTPStatusCode"]
    if code == "NoSuchKey":
        ...
    elif code == "AccessDenied":
        ...
    raise
```

| Поле | Пример |
|------|--------|
| `Error.Code` | `NoSuchBucket`, `ConditionalCheckFailedException` |
| `Error.Message` | human-readable |
| `ResponseMetadata.HTTPStatusCode` | 404, 403 |

`S3Service.ensure_bucket` ловит `ClientError` и создаёт bucket — паттерн «exists or create».

---

## Retryable vs fatal

| Code | Retry? |
|------|--------|
| `ThrottlingException` | ✅ (with backoff) |
| `ProvisionedThroughputExceededException` | ✅ |
| `503 Service Unavailable` | ✅ |
| `NoSuchKey` | ❌ |
| `ValidationException` | ❌ |
| `AccessDenied` | ❌ (fix IAM) |

botocore **standard retry mode** — exponential backoff, max attempts (default ~3–4).

```python
from botocore.config import Config

cfg = Config(retries={"max_attempts": 10, "mode": "standard"})
s3 = session.client("s3", config=cfg, endpoint_url=...)
```

**Adaptive mode** — для high throughput (DynamoDB hot partitions).

---

## Idempotency и retries

Retry безопасен только для **idempotent** операций:

| Operation | Idempotent? |
|-----------|-------------|
| `get_object` | ✅ |
| `put_object` same key | ⚠️ overwrite |
| `delete_object` | ✅ |
| SQS `send_message` | ❌ duplicates |
| DDB `put_item` без condition | ❌ |

Подробнее в [18-lab-idempotent-ddb](18-lab-idempotent-ddb.md).

---

## Paginators

List API возвращают **страницы** (max 1000 keys S3, 1 MB DDB):

```python
paginator = s3.get_paginator("list_objects_v2")
for page in paginator.paginate(Bucket="shop-uploads", Prefix="orders/"):
    for obj in page.get("Contents", []):
        print(obj["Key"])
```

| Service | Paginator name |
|---------|----------------|
| S3 | `list_objects_v2` |
| DynamoDB | `scan`, `query` |
| SQS | `list_queues` |

**Anti-pattern:** ручной loop с `ContinuationToken` — paginator надёжнее. `S3Service.list_keys` в labs без pagination — ok для малого dataset; production — paginator.

---

## Waiters

```python
ddb = client("dynamodb")
ddb.create_table(...)
waiter = ddb.get_waiter("table_exists")
waiter.wait(TableName="shop-items")
```

`DynamoDBRepository.ensure_table` использует waiter — table **ACTIVE** перед writes.

---

## Logging debug

```python
import logging
import boto3
boto3.set_stream_logger("botocore", logging.DEBUG)
```

Показывает signed HTTP requests — **не включайте** в prod с secrets.

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| Игнор `ClientError` code | treat 404 as 500 |
| Retry non-idempotent blindly | duplicate side effects |
| Первую страницу = весь dataset | silent data loss |
| Infinite retry on AccessDenied | hung job |

## Резюме

Ловите **`ClientError` по Code**. Доверяйте botocore retries для transient errors. **Paginators** обязательны для list/scan. **Waiters** — после create resource.

Далее: [07-s3-boto3-basics](07-s3-boto3-basics.md).
