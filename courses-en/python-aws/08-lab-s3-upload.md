# 08. Lab: S3 upload and download

## Scenario

Feature: a user uploads an **avatar** — the backend saves it to S3 and returns the key to the client. You need to verify the round-trip through `S3Service` and understand the smoke pipeline.

**Goal:** upload bytes, list by prefix, download, delete; run pytest with moto.

---

## Step 1. Bootstrap

```bash
docker exec mock-python-aws-lab python lab_cli.py bootstrap
```

---

## Step 2. Upload via Python

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.s3_service import S3Service

svc = S3Service()
key = svc.put_bytes(
    'avatars/user-42.png',
    b'\x89PNG\r\n...fake...',
    content_type='image/png',
)
print('uploaded:', key)
print('keys:', svc.list_keys('avatars/'))
"
```

---

## Step 3. Download and verify

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.s3_service import S3Service

svc = S3Service()
data = svc.get_bytes('avatars/user-42.png')
assert data.startswith(b'\x89PNG')
print('download OK, len=', len(data))
"
```

---

## Step 4. Upload a file with open()

In the lab shell create `upload_lab.py`:

```python
from pathlib import Path
from shop_aws.s3_service import S3Service

path = Path("/tmp/sample.txt")
path.write_text("hello s3 lab", encoding="utf-8")

svc = S3Service()
body = path.read_bytes()
svc.put_bytes("lab/sample.txt", body, content_type="text/plain")
assert svc.get_bytes("lab/sample.txt") == body
print("file upload OK")
```

---

## Step 5. Delete cleanup

```python
svc.delete("avatars/user-42.png")
assert "avatars/user-42.png" not in svc.list_keys("avatars/")
```

---

## Step 6. pytest (moto)

```bash
docker exec mock-python-aws-lab pytest tests/test_s3_moto.py -v
```

moto mock without LocalStack — fast unit tests.

---

## Success criteria

- [ ] put_bytes + get_bytes round-trip
- [ ] list_keys with a prefix filters
- [ ] delete removes the object
- [ ] pytest test_s3_moto green
- [ ] ContentType is set for text/png

Next: [09-s3-advanced-presigned](09-s3-advanced-presigned.md).
