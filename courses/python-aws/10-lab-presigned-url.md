# 10. Лаба: presigned URL

## Сценарий

Mobile app загружает фото **напрямую в S3** — backend выдаёт presigned PUT на 10 минут. Реализуйте и проверьте flow на LocalStack.

**Цель:** сгенерировать presigned GET и PUT, выполнить upload через curl, скачать файл.

---

## Шаг 1. Presigned GET

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

## Шаг 2. Download через curl (с хоста)

```bash
curl -s "<PRESIGNED_URL>"
# presigned content
```

URL содержит `localhost:4566` или `localstack:4566` — с **хоста** нужен `localhost`.

---

## Шаг 3. Presigned PUT

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

Upload с хоста:

```bash
curl -X PUT -d 'binary-data' \
  -H "Content-Type: application/octet-stream" \
  "<PRESIGNED_PUT_URL>"
```

---

## Шаг 4. Verify upload

```bash
docker exec mock-python-aws-lab python -c "
from shop_aws.s3_service import S3Service
print(S3Service().get_bytes('lab/direct-upload.bin'))
"
```

---

## Шаг 5. Mini helper PresignHelper

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

## Критерии приёмки

- [ ] Presigned GET скачивает объект через curl
- [ ] Presigned PUT загружает без AWS keys в curl
- [ ] Content-Type header совпадает с Params
- [ ] Объект виден через `S3Service.get_bytes`

Далее: [11-s3-events-notifications](11-s3-events-notifications.md).
