# 06. Errors, retries, paginators

## Intro: "list_objects returned 1000 keys — where are the rest?"

A migration script listing an S3 bucket — the first 1000 keys are ok, then **silence**. Another case: a transient `503` from DynamoDB — without retry the script crashes halfway through a batch. boto3 **can** retry and paginate — if you call the API correctly.

## What you'll learn

- `ClientError` and the `Error` dict from the response.
- botocore's built-in **retries** (standard mode).
- **Paginators** for list/query operations.

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

| Field | Example |
|------|--------|
| `Error.Code` | `NoSuchBucket`, `ConditionalCheckFailedException` |
| `Error.Message` | human-readable |
| `ResponseMetadata.HTTPStatusCode` | 404, 403 |

`S3Service.ensure_bucket` catches `ClientError` and creates the bucket — the "exists or create" pattern.

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

botocore's **standard retry mode** — exponential backoff, max attempts (default ~3–4).

```python
from botocore.config import Config

cfg = Config(retries={"max_attempts": 10, "mode": "standard"})
s3 = session.client("s3", config=cfg, endpoint_url=...)
```

**Adaptive mode** — for high throughput (DynamoDB hot partitions).

---

## Idempotency and retries

Retry is safe only for **idempotent** operations:

| Operation | Idempotent? |
|-----------|-------------|
| `get_object` | ✅ |
| `put_object` same key | ⚠️ overwrite |
| `delete_object` | ✅ |
| SQS `send_message` | ❌ duplicates |
| DDB `put_item` without a condition | ❌ |

More in [18-lab-idempotent-ddb](18-lab-idempotent-ddb.md).

---

## Paginators

List APIs return **pages** (max 1000 keys for S3, 1 MB for DDB):

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

**Anti-pattern:** a manual loop with `ContinuationToken` — a paginator is more reliable. `S3Service.list_keys` in labs has no pagination — ok for a small dataset; production — paginator.

---

## Waiters

```python
ddb = client("dynamodb")
ddb.create_table(...)
waiter = ddb.get_waiter("table_exists")
waiter.wait(TableName="shop-items")
```

`DynamoDBRepository.ensure_table` uses a waiter — the table is **ACTIVE** before writes.

---

## Debug logging

```python
import logging
import boto3
boto3.set_stream_logger("botocore", logging.DEBUG)
```

Shows signed HTTP requests — **don't enable** in prod with secrets.

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Ignoring the `ClientError` code | treat 404 as 500 |
| Retrying non-idempotent blindly | duplicate side effects |
| Treating the first page as the whole dataset | silent data loss |
| Infinite retry on AccessDenied | hung job |

## Summary

Catch **`ClientError` by Code**. Trust botocore retries for transient errors. **Paginators** are mandatory for list/scan. **Waiters** — after creating a resource.

Next: [07-s3-boto3-basics](07-s3-boto3-basics.md).
