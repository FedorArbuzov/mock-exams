# 02. Session, client vs resource

## Intro: "two ways to put an object into S3 — which is correct?"

A junior copies a snippet with `s3.meta.client.upload_file` and a snippet with `s3.put_object`. Both work. A senior asks: **client or resource?** One Session per process or per call? The wrong choice means extra connection pools and an inconsistent region.

This chapter is the **boto3 object model** using [`shop_aws/clients.py`](../../deploy/python-aws/stack/shop_aws/clients.py) as an example.

## What you'll learn

- What `boto3.Session` is and why to reuse it.
- **Low-level client** vs **high-level resource**.
- When the course stack mixes both (DynamoDB).

---

## boto3 hierarchy

```text
boto3.Session(credentials, region)
    ├── .client("s3")      → dict-like API, 1:1 with the AWS API
    └── .resource("s3")      → object-oriented wrappers
            └── .Bucket(name)
                    └── .upload_file(...)
```

Under the hood, **botocore** keeps one HTTP session pool per client.

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

| Session parameter | Default source |
|------------------|----------------------|
| `aws_access_key_id` | env `AWS_ACCESS_KEY_ID` |
| `aws_secret_access_key` | env `AWS_SECRET_ACCESS_KEY` |
| `region_name` | env `AWS_DEFAULT_REGION` |
| profile | env `AWS_PROFILE` → `~/.aws/credentials` |

**Best practice:** one factory per application (like `boto_session()` in the stack), not `boto3.client()` in every function — otherwise you get extra connection pools.

Course stack:

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

| Pros | Cons |
|-------|--------|
| Full API coverage | Verbose |
| Exact operation names from AWS docs | Manual streaming |
| Paginators, waiters | |

`S3Service` in the stack uses **client only** — explicit control over `put_object`, `list_objects_v2`.

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

| Pros | Cons |
|-------|--------|
| Pythonic collections | Not all APIs are available |
| `Table.put_item` is shorter | Hides response details |
| Batch helpers (`batch_writer`) | Extra abstraction layer |

`DynamoDBRepository` uses **client** for `create_table` + **resource** for `put_item` — a typical hybrid.

---

## Client vs resource: decision table

| Task | Choice |
|--------|-------|
| `put_object` / `get_object` | client (like S3Service) |
| Low-level multipart upload | client |
| Iterate `bucket.objects` | resource |
| `Table.get_item` | resource is more convenient |
| `transact_write_items` | client only |
| Lambda cold start | one client, lazy init |

---

## Endpoint URL (LocalStack)

```python
def client(service: str):
    kwargs = {}
    if settings.endpoint_url:
        kwargs["endpoint_url"] = settings.endpoint_url
    return boto_session().client(service, **kwargs)
```

Without `endpoint_url`, boto3 goes to **real AWS** for the given region. A dangerous mistake is forgetting the env locally and accidentally hitting production.

---

## Thread safety and Lambda

| Context | Recommendation |
|---------|--------------|
| FastAPI / Django | module-level client or an `@lru_cache` factory |
| Celery worker | one client per process |
| Lambda | init outside the handler — reuse |

Clients are **thread-safe** for read operations; for writes, check the service documentation (S3 — ok).

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| `boto3.client("s3")` without a Session in the app | inconsistent region |
| Resource for an operation without a wrapper | `AttributeError` |
| Not closing the `Body` stream | connection leak (rare) |
| Two Sessions with different keys | intermittent auth errors |

## Summary

**Session** — credentials + region. **Client** — the full AWS API, dict responses. **Resource** — convenient objects. Course stack: S3 via client, DynamoDB — hybrid. Always centralize the factory.

Next: [03-lab-explore-localstack](03-lab-explore-localstack.md).
