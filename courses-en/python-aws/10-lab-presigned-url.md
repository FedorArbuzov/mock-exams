# 10. Lab: presigned URL

## Scenario

A mobile app uploads a photo **directly to S3** — the backend issues a presigned PUT valid for 10 minutes. Implement and verify the flow on LocalStack.

**Goal:** generate a presigned GET and PUT, perform an upload via curl, download the file.

---

## Step 1. Presigned GET

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.s3_service import S3Service
from shop_aws.clients import client

svc = S3Service()
svc.put_bytes('lab/presign-demo.txt', b'presigned content', content_type='text/plain')

s3 = client('s3')
url = s3.generate_presigned_url(
    'get_object',
    Params={'Bucket': svc.bucket, 'Key': 'lab/presign-demo.txt'},
    ExpiresIn=300,
)
print(url)
"
```

---

## Step 2. Download via curl (from the host)

```bash
curl -s "<PRESIGNED_URL>"
# presigned content
```

The URL contains `localhost:4566` or `localstack:4566` — from the **host** you need `localhost`.

---

## Step 3. Presigned PUT

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.clients import client
from shop_aws.config import settings

s3 = client('s3')
url = s3.generate_presigned_url(
    'put_object',
    Params={
        'Bucket': settings.shop_bucket,
        'Key': 'lab/direct-upload.bin',
        'ContentType': 'application/octet-stream',
    },
    ExpiresIn=300,
)
print(url)
"
```

Upload from the host:

```bash
curl -X PUT -d 'binary-data' \
  -H "Content-Type: application/octet-stream" \
  "<PRESIGNED_PUT_URL>"
```

---

## Step 4. Verify upload

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.s3_service import S3Service
print(S3Service().get_bytes('lab/direct-upload.bin'))
"
```

---

## Step 5. Mini helper PresignHelper

```python
from shop_aws.clients import client
from shop_aws.config import settings

class PresignHelper:
    def __init__(self):
        self._s3 = client("s3")
        self.bucket = settings.shop_bucket

    def upload_url(self, key: str, content_type: str, ttl: int = 600) -> str:
        return self._s3.generate_presigned_url(
            "put_object",
            Params={"Bucket": self.bucket, "Key": key, "ContentType": content_type},
            ExpiresIn=ttl,
        )
```

---

## Success criteria

- [ ] Presigned GET downloads the object via curl
- [ ] Presigned PUT uploads without AWS keys in curl
- [ ] The Content-Type header matches Params
- [ ] The object is visible via `S3Service.get_bytes`

Next: [11-s3-events-notifications](11-s3-events-notifications.md).
