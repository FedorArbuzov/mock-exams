# 33. Testing AWS code: moto vs LocalStack, pytest

## Введение: «тесты проходят локально, падают в CI — endpoint_url»

pytest с LocalStack требует Docker и flaky network. **moto** mock'ает boto3 in-process — быстро, но не полная parity. Правильная стратегия: **unit с moto**, **integration с LocalStack**, e2e smoke script.

Эталон: [`tests/test_s3_moto.py`](../../deploy/python-aws/stack/tests/test_s3_moto.py).

## Что вы узнаете

- moto `@mock_aws` decorator.
- Disable `endpoint_url` for moto.
- LocalStack integration tests pattern.
- Fixtures, monkeypatch settings.

---

## moto overview

```python
from moto import mock_aws

@mock_aws
def test_s3():
    # boto3 calls hit moto backend in memory
    ...
```

| Pros | Cons |
|------|------|
| fast, no Docker | incomplete service emulation |
| CI friendly | behavior drift vs AWS |
| works offline | no cross-service real wiring |

moto 5.x: `@mock_aws` covers multiple services.

---

## test_s3_moto.py pattern

```python
@pytest.fixture
def aws_env(monkeypatch):
    monkeypatch.setattr(settings, "endpoint_url", None)
    monkeypatch.setattr(settings, "shop_bucket", "test-shop-bucket")


@mock_aws
def test_s3_put_get(aws_env):
    svc = S3Service()
    svc.ensure_bucket()
    svc.put_bytes("a.txt", b"hello")
    assert svc.get_bytes("a.txt") == b"hello"
```

**Critical:** `endpoint_url=None` — иначе boto3 идёт в LocalStack, moto не перехватывает.

---

## pytest structure

```text
stack/tests/
├── conftest.py          # shared fixtures
├── test_s3_moto.py
├── test_dynamodb_moto.py
└── test_integration_localstack.py  # optional, marker
```

Run:

```bash
docker exec mock-python-aws-lab pytest tests/ -v
```

Host:

```bash
cd deploy/python-aws/stack
pip install -r requirements.txt pytest moto
AWS_ENDPOINT_URL= pytest tests/ -v
```

---

## LocalStack integration tests

```python
import pytest

pytestmark = pytest.mark.integration

def test_real_queue_roundtrip():
    # requires LocalStack up, endpoint_url set
    from shop_aws.sqs_service import SQSService
    sqs = SQSService()
    sqs.send({"ping": True})
    msg = sqs.receive_one()
    assert msg["ping"] is True
```

`pytest.ini`:

```ini
[pytest]
markers =
    integration: needs LocalStack
```

CI: unit job (moto only); integration job (compose up).

---

## moto vs LocalStack matrix

| Scenario | Tool |
|----------|------|
| S3Service CRUD | moto |
| Lambda + S3 notification | LocalStack |
| IAM policy edge cases | LocalStack or AWS |
| DynamoDB conditional | moto (basic) |
| Secrets Manager | moto `@mock_aws` |

---

## monkeypatch settings

```python
@pytest.fixture
def shop_settings(monkeypatch):
    monkeypatch.setattr(settings, "endpoint_url", None)
    monkeypatch.setattr(settings, "shop_table", "test-table")
    monkeypatch.setattr(settings, "shop_bucket", "test-bucket")
    monkeypatch.setattr(settings, "shop_queue", "test-queue")
```

Central fixture avoids per-test duplication.

---

## Testing Lambda handlers

```python
@mock_aws
def test_process_s3_upload(shop_settings):
    svc = S3Service()
    svc.ensure_bucket()
    svc.put_bytes("uploads/x.bin", b"data")
    DynamoDBRepository().ensure_table()
    event = {"Records": [{"s3": {
        "bucket": {"name": settings.shop_bucket},
        "object": {"key": "uploads/x.bin", "size": 4},
    }}]}
    out = process_s3_upload(event, None)
    assert out["processed"] == 1
```

No Lambda service invoke — test handler function directly.

---

## botocore stubber (alternative)

For single-client error paths without full moto:

```python
from botocore.stub import Stubber
```

Useful for `ClientError` retry logic ([06-errors-retries-paginators](06-errors-retries-paginators.md)).

---

## Типичные ошибки

| Ошибка | Symptom |
|--------|---------|
| endpoint_url set during moto | calls leave mock |
| Shared bucket names in parallel tests | flakiness |
| No ensure_table in test | ResourceNotFound |
| Integration tests in default CI | compose missing |

## Резюме

**moto** — fast unit tests; disable LocalStack endpoint. **LocalStack** — integration wiring. pytest fixtures patch `settings`. Handler tests invoke function directly with fake event.

Далее: [34-lab-pytest-aws](34-lab-pytest-aws.md).
