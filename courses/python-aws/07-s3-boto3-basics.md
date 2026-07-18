# 07. S3 boto3: put, get, list, delete

## Введение: «загрузили PDF — пользователь скачивает битый файл»

Upload прошёл без exception, но `Content-Type` = `application/octet-stream`, encoding сломан, или ключ с пробелами превратился в `%20`. S3 простой на первый взгляд — **дьявол в деталях** metadata и keys.

Эталон курса: [`S3Service`](../../deploy/python-aws/stack/shop_aws/s3_service.py).

## Что вы узнаете

- Core API: `put_object`, `get_object`, `list_objects_v2`, `delete_object`.
- Bucket lifecycle в labs: `ensure_bucket`, `head_bucket`.
- Keys, prefixes, streaming `Body`.

---

## Модель S3

```text
Bucket (shop-uploads)
  └── Object key = "orders/2024/invoice.pdf"
        ├── Body (bytes)
        ├── ContentType
        ├── Metadata (user-defined)
        └── ETag
```

Keys — **flat namespace**; `/` — convention для «папок».

---

## ensure_bucket

```python
def ensure_bucket(self) -> None:
    try:
        self._s3.head_bucket(Bucket=self.bucket)
    except self._s3.exceptions.ClientError:
        self._s3.create_bucket(Bucket=self.bucket)
```

| API | Зачем |
|-----|-------|
| `head_bucket` | cheap exists check |
| `create_bucket` | только local/labs |

В AWS `us-east-1` create без LocationConstraint; другие regions — иначе.

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
| `Body` | bytes, file-like, или str (utf-8) |
| `ContentType` | браузер использует при download |
| `Metadata` | dict str→str, keys lowercased in HTTP |
| `ServerSideEncryption` | AES256 / aws:kms in prod |

Max single put: **5 GB** (multipart выше — [09-s3-advanced-presigned](09-s3-advanced-presigned.md)).

---

## get_object

```python
def get_bytes(self, key: str) -> bytes:
    return self._s3.get_object(Bucket=self.bucket, Key=key)["Body"].read()
```

Response содержит `Body` (StreamingBody), `ContentType`, `Metadata`, `ETag`. **Always** `.read()` или iterate chunks для больших файлов.

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
| `Delimiter` | `"/"` → CommonPrefixes «folders» |
| `MaxKeys` | page size (default 1000) |

Production: **paginator** ([06-errors-retries-paginators](06-errors-retries-paginators.md)).

---

## delete_object

```python
def delete(self, key: str) -> None:
    self._s3.delete_object(Bucket=self.bucket, Key=key)
```

Idempotent — delete missing key **не ошибка**. Versioned bucket — нужен `VersionId`.

---

## Key naming best practices

| Good | Bad |
|------|-----|
| `uploads/{user_id}/{uuid}.jpg` | `report final (1).pdf` |
| URL-safe chars | unencoded unicode surprises |
| prefix by tenant/date | single hot prefix (scale) |

Lambda handler декодирует key: `urllib.parse.unquote_plus` ([`handlers.py`](../../deploy/python-aws/stack/shop_aws/lambda_handlers/handlers.py)).

---

## S3 vs filesystem

| | Local FS | S3 |
|--|----------|-----|
| Rename | cheap | copy + delete |
| Partial update | yes | replace whole object |
| Consistency | strong | read-after-write for new objects |
| Cost | disk | per request + storage |

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| Забыть `ContentType` | browser download wrong |
| Не decode key из event | `%2F` in path |
| Load 500 MB in memory | OOM |
| list без pagination | incomplete migration |

## Резюме

S3 CRUD через client: **put/get/list/delete**. Задавайте **ContentType**. Prefixes организуют keys. Большие listing — paginator. `S3Service` — минимальный wrapper для labs.

Далее: [08-lab-s3-upload](08-lab-s3-upload.md).
