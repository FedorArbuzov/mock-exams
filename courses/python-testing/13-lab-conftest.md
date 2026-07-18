# 13. Лаба: реорганизация tests/ и integration gate

## Цель лабы

Разнести tests на **unit/** и **integration/**; добавить **auto-skip** integration без `RUN_INTEGRATION=1`.

## Предварительно

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
pytest -v
```

Теория: [12-conftest-layout](12-conftest-layout.md).

---

## Задание 1. Перенос unit tests

```bash
mkdir -p tests/unit
mv tests/test_pricing.py tests/unit/
mv tests/test_cart.py tests/unit/
mv tests/test_users.py tests/unit/
mv tests/test_users_fake.py tests/unit/
# test_pricing_starter.py тоже в unit/
mv tests/test_pricing_starter.py tests/unit/
```

`conftest.py` **остаётся** в `tests/`.

**Что увидите:** `pytest -v` всё ещё находит tests — `testpaths = ["tests"]`.

---

## Задание 2. integration/conftest.py

```python
# tests/integration/conftest.py
import os
import pytest

LIVE_BASE = os.getenv("LIVE_BASE_URL", "http://localhost:8095")


@pytest.fixture(scope="session")
def live_base_url() -> str:
    return LIVE_BASE
```

---

## Задание 3. pytest_collection_modifyitems

В `tests/conftest.py` добавьте:

```python
import os
import pytest


def pytest_collection_modifyitems(config, items):
    if os.getenv("RUN_INTEGRATION"):
        return
    skip = pytest.mark.skip(reason="integration: set RUN_INTEGRATION=1")
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip)
```

---

## Задание 4. Первый integration test

`tests/integration/test_gateway_health.py`:

```python
import httpx
import pytest


@pytest.mark.integration
def test_gateway_health(live_base_url):
    r = httpx.get(f"{live_base_url}/health", timeout=5.0)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
```

Без docker:

```bash
pytest -v
# integration SKIPPED
```

С docker ([`deploy/python-async`](../../deploy/python-async/README.md)):

```bash
# terminal 1
cd deploy/python-async && docker compose up -d

# terminal 2
cd courses/python-testing/examples
set RUN_INTEGRATION=1          # Windows
# export RUN_INTEGRATION=1     # Linux
pytest tests/integration -v
```

**Что увидите:** 1 passed против :8095.

---

## Задание 5. Быстрый MR job локально

```bash
pytest -m "not integration" -v
```

**Что увидите:** только unit, без skip messages на integration (они не collected если path-only unit — или skipped если collected).

---

## Если не working

| Симптом | Действие |
|---------|----------|
| import tests.fakes broken | fix path или PYTHONPATH |
| connection refused :8095 | docker compose up |
| integration not skipped | проверьте hook в root conftest |

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | tests/unit/ содержит pricing, cart, users |
| 2 | integration skip без RUN_INTEGRATION |
| 3 | live health test pass с docker |
| 4 | `pytest -m "not integration"` быстрый |

## Уборка

Структура остаётся до capstone.

## Вопросы для самопроверки

1. Зачем hook, а не только `-m`?
2. scope session для live_base_url — ok?

Далее: [14-coverage](14-coverage.md).
