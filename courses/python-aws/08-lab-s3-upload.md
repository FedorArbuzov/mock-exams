# 08. Лаба: S3 upload и download

## Сценарий

Feature: пользователь загружает **avatar** — backend сохраняет в S3, отдаёт key клиенту. Нужно проверить round-trip через `S3Service` и понять smoke pipeline.

**Цель:** upload bytes, list by prefix, download, delete; прогнать pytest moto.

---

## Шаг 1. Bootstrap

```bash
docker exec mock-python-aws-lab python lab_cli.py bootstrap
```

---

## Шаг 2. Upload через Python

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

## Шаг 3. Download и verify

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

## Шаг 4. Upload file with open()

В lab shell создайте `upload_lab.py`:

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

## Шаг 5. Delete cleanup

```python
svc.delete("avatars/user-42.png")
assert "avatars/user-42.png" not in svc.list_keys("avatars/")
```

---

## Шаг 6. pytest (moto)

```bash
docker exec mock-python-aws-lab pytest tests/test_s3_moto.py -v
```

moto mock без LocalStack — быстрые unit tests.

---

## Критерии приёмки

- [ ] put_bytes + get_bytes round-trip
- [ ] list_keys с prefix фильтрует
- [ ] delete удаляет объект
- [ ] pytest test_s3_moto green
- [ ] ContentType задан для text/png

Далее: [09-s3-advanced-presigned](09-s3-advanced-presigned.md).
