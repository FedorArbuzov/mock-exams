# 21. Лаба: responses и live gateway

## Цель лабы

Покрыть `UserService` через **responses**; добавить live tests **aggregate** на :8095.

## Предварительно

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
```

Теория: [20-http-testing](20-http-testing.md).

---

## Задание 1. tests/unit/test_users_responses.py

```python
import responses
from shop.users import UserService


@responses.activate
def test_get_user_responses():
    responses.add(
        responses.GET,
        "http://api.shop/users/5",
        json={"id": 5, "email": "five@shop.local", "active": True},
        status=200,
    )
    user = UserService("http://api.shop").get_user(5)
    assert user.id == 5
    assert len(responses.calls) == 1
```

**Что увидите:** без MagicMock chain.

---

## Задание 2. 503 from API

```python
@responses.activate
def test_service_unavailable():
    responses.add(
        responses.GET,
        "http://api.shop/users/1",
        json={"detail": "down"},
        status=503,
    )
    import httpx
    import pytest

    with pytest.raises(httpx.HTTPStatusError):
        UserService("http://api.shop").get_user(1)
```

---

## Задание 3. live /health

```bash
cd deploy/python-async && docker compose up -d
```

`tests/integration/test_gateway_live.py`:

```python
import httpx
import pytest


@pytest.mark.integration
def test_health(live_base_url):
    r = httpx.get(f"{live_base_url}/health", timeout=5.0)
    assert r.status_code == 200
```

```bash
set RUN_INTEGRATION=1
pytest tests/integration/test_gateway_live.py -v
```

---

## Задание 4. aggregate structure

```python
@pytest.mark.integration
def test_aggregate_parallel_structure(live_base_url):
    r = httpx.get(f"{live_base_url}/aggregate-parallel", timeout=30.0)
    assert r.status_code == 200
    data = r.json()
    assert data["mode"] == "parallel"
    assert len(data["results"]) == 3
```

---

## Задание 5. /fail probabilistic

```python
@pytest.mark.integration
def test_fail_endpoint_returns_503_or_200(live_base_url):
    r = httpx.get(f"{live_base_url}/fail", params={"rate": 1.0}, timeout=5.0)
    assert r.status_code == 503
```

`rate=1.0` — deterministic 503 для test.

---

## Если не working

| Симптом | Действие |
|---------|----------|
| Connection refused | docker compose ps |
| responses 404 | exact URL match |
| skip integration | RUN_INTEGRATION=1 |

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | responses tests без mock client inject |
| 2 | live health + aggregate |
| 3 | deterministic /fail test |
| 4 | unit job без docker green |

## Уборка

Сохраните integration tests.

## Вопросы для самопроверки

1. responses vs inject mock — trade-off?
2. Зачем rate=1.0?

Далее: [22-testcontainers](22-testcontainers.md).
