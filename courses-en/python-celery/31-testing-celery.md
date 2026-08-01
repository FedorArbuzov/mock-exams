# 31. Testing: eager mode, pytest

## Intro

A unit test shouldn't require RabbitMQ. **Eager mode** runs tasks synchronously in-process. Integration tests — a real broker in CI.

[`python-testing`](../python-testing/README.md) — pytest fundamentals.

## What you'll learn

- `CELERY_TASK_ALWAYS_EAGER`.
- pytest fixtures for the Celery app.
- Mocking `.delay()`.

---

## Eager mode

```python
app.conf.task_always_eager = True
app.conf.task_store_eager_result = True
```

`.delay()` executes **immediately** in the same process — no broker.

```python
def test_add_eager(celery_app):
    celery_app.conf.task_always_eager = True
    result = add.delay(2, 3)
    assert result.get() == 5
```

---

## pytest fixture

```python
# tests/conftest.py
import pytest
from shop.celery_app import app as celery_app

@pytest.fixture
def celery_config():
    return {
        "task_always_eager": True,
        "task_store_eager_result": True,
        "broker_url": "memory://",
        "result_backend": "cache+memory://",
    }

@pytest.fixture
def celery_worker(celery_config):
    celery_app.conf.update(celery_config)
    yield celery_app
    celery_app.conf.clear()
```

Use `pytest-celery` plugin for integration with real worker in Docker (advanced).

---

## Test task logic directly

```python
def test_process_order_idempotent():
    from shop.tasks import process_order, PROCESSED_IDS
    PROCESSED_IDS.clear()
    r1 = process_order("ord-1", "10.00")
    r2 = process_order("ord-1", "10.00")
    assert r1["status"] == "completed"
    assert r2["status"] == "already_processed"
```

Call function without Celery — fastest unit test.

---

## Mock delay in API tests

```python
from unittest.mock import patch, MagicMock

def test_create_order_returns_task_id(client):
    mock_result = MagicMock()
    mock_result.id = "fake-uuid"
    with patch("shop.main.process_order.delay", return_value=mock_result):
        r = client.post("/orders/", json={"order_id": "x", "amount": "1"})
    assert r.status_code == 200
    assert r.json()["task_id"] == "fake-uuid"
```

---

## Integration test (optional)

CI service container rabbitmq + redis + run worker — [`gitlab-basic`](../gitlab-basic/README.md).

---

## What not to test

- Celery internals
- Broker wire protocol

Test **your business logic** in tasks.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Eager in production | env flag for tests only |
| Shared PROCESSED_IDS between tests | clear in fixture |
| Integration without timeout | `.get(timeout=5)` |

## Summary

Unit: call the task fn directly or use eager mode. API: mock `.delay()`. Integration: broker in CI, sparingly.

Next: [32-lab-testing](32-lab-testing.md).
