# 34. Лаба: pytest suite с moto

## Сценарий

Расширяем тесты стека: S3 (exists), DynamoDB CRUD, SQS send/receive, Lambda handler `hello`. Всё in-process moto — **без** LocalStack для CI speed.

**Цель:** ≥4 test modules/files green in `pytest tests/ -v`.

---

## Шаг 1. conftest.py

Создайте `stack/tests/conftest.py`:

```python
import pytest
from shop_aws.config import settings


@pytest.fixture
def aws_env(monkeypatch):
    monkeypatch.setattr(settings, "endpoint_url", None)
    monkeypatch.setattr(settings, "shop_bucket", "test-shop-bucket")
    monkeypatch.setattr(settings, "shop_table", "test-shop-table")
    monkeypatch.setattr(settings, "shop_queue", "test-shop-queue")
    yield settings
```

---

## Шаг 2. test_dynamodb_moto.py

```python
import pytest
from moto import mock_aws
from shop_aws.dynamodb_repo import DynamoDBRepository


@mock_aws
def test_put_get_item(aws_env):
    repo = DynamoDBRepository()
    repo.ensure_table()
    repo.put_item("pk-1", {"name": "widget"})
    item = repo.get_item("pk-1")
    assert item["name"] == "widget"
```

---

## Шаг 3. test_sqs_moto.py

```python
from moto import mock_aws
from shop_aws.sqs_service import SQSService


@mock_aws
def test_send_receive(aws_env):
    sqs = SQSService()
    _ = sqs.queue_url  # create
    sqs.send({"event": "test"})
    msg = sqs.receive_one(wait_seconds=0)
    assert msg["event"] == "test"
```

---

## Шаг 4. test_handlers_moto.py

```python
import json
from moto import mock_aws
from shop_aws.lambda_handlers.handlers import hello, process_s3_upload
from shop_aws.s3_service import S3Service
from shop_aws.dynamodb_repo import DynamoDBRepository
from shop_aws.config import settings


class FakeContext:
    aws_request_id = "t"
    function_name = "f"
    memory_limit_in_mb = 128
    def get_remaining_time_in_millis(self):
        return 60000


@mock_aws
def test_hello_handler(aws_env):
    out = hello({"name": "pytest"}, FakeContext())
    assert out["statusCode"] == 200
    body = json.loads(out["body"])
    assert body["message"] == "Hello, pytest!"


@mock_aws
def test_process_s3_upload_handler(aws_env):
    S3Service().ensure_bucket()
    DynamoDBRepository().ensure_table()
    S3Service().put_bytes("uploads/t.bin", b"testdata")
    event = {"Records": [{"s3": {
        "bucket": {"name": settings.shop_bucket},
        "object": {"key": "uploads/t.bin", "size": 8},
    }}]}
    result = process_s3_upload(event, FakeContext())
    assert result["processed"] == 1
    item = DynamoDBRepository().get_item("file:uploads/t.bin")
    assert item["size"] == 8
```

---

## Шаг 5. Run suite

```bash
docker exec mock-python-aws-lab pytest tests/ -v --tb=short
```

Expected: existing `test_s3_moto.py` + new tests all pass.

---

## Шаг 6. Marker integration (optional)

```python
# test_localstack_smoke.py
import pytest
from shop_aws.clients import client

@pytest.mark.integration
def test_sts_local():
    client("sts").get_caller_identity()
```

Run integration only when compose up:

```bash
docker exec mock-python-aws-lab pytest tests/ -v -m integration
```

---

## Шаг 7. Coverage (optional)

```bash
docker exec mock-python-aws-lab pip install pytest-cov
docker exec mock-python-aws-lab pytest tests/ --cov=shop_aws --cov-report=term-missing
```

Target: `s3_service`, `dynamodb_repo`, `handlers` covered.

---

## Критерии приёмки

- [ ] `conftest.py` clears endpoint_url
- [ ] DynamoDB put/get test passes
- [ ] SQS roundtrip test passes
- [ ] hello + process_s3_upload handler tests pass
- [ ] Full `pytest tests/ -v` green

## Резюме

moto + pytest — стандарт тестирования boto3 wrappers. Patch settings, `@mock_aws`, test handlers as functions. Interview prep — next.

Далее: [35-interview-qa](35-interview-qa.md).
