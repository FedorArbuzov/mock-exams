# 32. Лаба: test tasks

## Цель

Добавить `tests/` для shop package: unit tests tasks + mock API.

---

## Шаг 1. Layout

```text
deploy/celery/stack/
  tests/
    conftest.py
    test_tasks.py
    test_api.py
  shop/
    ...
```

Add to `requirements.txt`:

```text
pytest==8.3.4
httpx==0.28.1
```

---

## Шаг 2. test_tasks.py

```python
from shop.tasks import add, process_order, PROCESSED_IDS


def test_add():
    assert add(3, 4) == 7


def test_process_order_idempotent():
    PROCESSED_IDS.clear()
    first = process_order("t-1", "10.00")
    second = process_order("t-1", "10.00")
    assert first["status"] == "completed"
    assert second["status"] == "already_processed"


def test_process_order_fail():
    PROCESSED_IDS.clear()
    import pytest
    from celery.exceptions import Reject
    with pytest.raises(Reject):
        process_order("f-1", "fail")
```

---

## Шаг 3. test_api.py

```python
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from shop.main import app

client = TestClient(app)


def test_health():
    assert client.get("/health/").json()["status"] == "ok"


def test_ping_queues_task():
    mock = MagicMock(id="tid-1")
    with patch("shop.main.ping.delay", return_value=mock):
        r = client.post("/tasks/ping/")
    assert r.json()["task_id"] == "tid-1"
```

---

## Шаг 4. Run

```bash
cd deploy/celery/stack
pip install -r requirements.txt pytest
pytest tests/ -v
```

Or in container:

```bash
docker exec mock-celery-api pip install pytest
docker exec mock-celery-api pytest /app/tests -v
```

---

## Шаг 5. Eager test (optional)

```python
@pytest.fixture(autouse=True)
def eager_celery():
    from shop.celery_app import app
    app.conf.task_always_eager = True
    app.conf.task_store_eager_result = True
    yield
    app.conf.task_always_eager = False
```

---

## Критерии приёмки

- [ ] pytest green locally or in container
- [ ] ≥4 test functions
- [ ] idempotent + fail cases covered

Далее: [33-troubleshooting](33-troubleshooting.md).
