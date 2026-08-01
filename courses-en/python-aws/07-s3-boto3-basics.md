# 07. S3 boto3: put, get, list, delete

## Intro: "uploaded a PDF — the user downloads a corrupted file"

The upload went through without an exception, but `Content-Type` = `application/octet-stream`, the encoding is broken, or a key with spaces turned into `%20`. S3 looks simple at first glance — **the devil is in the details** of metadata and keys.

Course reference: [`S3Service`](../../deploy/python-aws/stack/shop_aws/s3_service.py).

## What you'll learn

- Core API: `put_object`, `get_object`, `list_objects_v2`, `delete_object`.
- Bucket lifecycle in labs: `ensure_bucket`, `head_bucket`.
- Keys, prefixes, streaming `Body`.

---

## The S3 model

```text
Bucket (shop-uploads)
  └── Object key = "orders/2024/invoice.pdf"
        ├── Body (bytes)
        ├── ContentType
        ├── Metadata (user-defined)
        └── ETag
```

Keys are a **flat namespace**; `/` is a convention for "folders".

---

## ensure_bucket

```python
def ensure_bucket(self) -> None:
    try:
        self._s3.head_bucket(Bucket=self.bucket)
    except self._s3.exceptions.ClientError:
        self._s3.create_bucket(Bucket=self.bucket)
```

| API | Why |
|-----|-------|
| `head_bucket` | cheap exists check |
| `create_bucket` | local/labs only |

In AWS `us-east-1` create without LocationConstraint; other regions — differently.

---

## put_object

```python
def put_bytes(self, key: str, body: bytes, content_type: str = "application/octet-stream") -> str:
    self._s3.put_object(
        Bucket=self.bucket,
        Key=key,
        Body=body,
        ContentType=content_type,
    )
    return key
```

| Parameter | Note |
|-----------|------|
| `Body` | bytes, file-like, or str (utf-8) |
| `ContentType` | the browser uses it on download |
| `Metadata` | dict str→str, keys lowercased in HTTP |
| `ServerSideEncryption` | AES256 / aws:kms in prod |

Max single put: **5 GB** (multipart above that — [09-s3-advanced-presigned](09-s3-advanced-presigned.md)).

---

## get_object

```python
def get_bytes(self, key: str) -> bytes:
    return self._s3.get_object(Bucket=self.bucket, Key=key)["Body"].read()
```

The response contains `Body` (StreamingBody), `ContentType`, `Metadata`, `ETag`. **Always** `.read()` or iterate chunks for large files.

---

## list_objects_v2

```python
def list_keys(self, prefix: str = "") -> list[str]:
    resp = self._s3.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
    return [o["Key"] for o in resp.get("Contents", [])]
```

| Parameter | Effect |
|-----------|--------|
| `Prefix` | filter by key start |
| `Delimiter` | `"/"` → CommonPrefixes "folders" |
| `MaxKeys` | page size (default 1000) |

Production: **paginator** ([06-errors-retries-paginators](06-errors-retries-paginators.md)).

---

## delete_object

```python
def delete(self, key: str) -> None:
    self._s3.delete_object(Bucket=self.bucket, Key=key)
```

Idempotent — deleting a missing key is **not an error**. On a versioned bucket you need a `VersionId`.

---

## Key naming best practices

| Good | Bad |
|------|-----|
| `uploads/{user_id}/{uuid}.jpg` | `report final (1).pdf` |
| URL-safe chars | unencoded unicode surprises |
| prefix by tenant/date | single hot prefix (scale) |

The Lambda handler decodes the key: `urllib.parse.unquote_plus` ([`handlers.py`](../../deploy/python-aws/stack/shop_aws/lambda_handlers/handlers.py)).

---

## S3 vs filesystem

| | Local FS | S3 |
|--|----------|-----|
| Rename | cheap | copy + delete |
| Partial update | yes | replace whole object |
| Consistency | strong | read-after-write for new objects |
| Cost | disk | per request + storage |

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Forgetting `ContentType` | browser download wrong |
| Not decoding the key from the event | `%2F` in path |
| Loading 500 MB into memory | OOM |
| list without pagination | incomplete migration |

## Summary

S3 CRUD via client: **put/get/list/delete**. Set the **ContentType**. Prefixes organize keys. Large listings — paginator. `S3Service` — a minimal wrapper for labs.

Next: [08-lab-s3-upload](08-lab-s3-upload.md).
