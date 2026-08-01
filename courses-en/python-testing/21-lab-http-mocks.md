# 21. Lab: responses and the live gateway

## Lab goal

Cover `UserService` via **responses**; add live **aggregate** tests against :8095.

## Prerequisites

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
```

Theory: [20-http-testing](20-http-testing.md).

---

## Task 1. tests/unit/test_users_responses.py

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

**What you'll see:** no MagicMock chain.

---

## Task 2. 503 from the API

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

## Task 3. live /health

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

## Task 4. aggregate structure

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

## Task 5. /fail probabilistic

```python
@pytest.mark.integration
def test_fail_endpoint_returns_503_or_200(live_base_url):
    r = httpx.get(f"{live_base_url}/fail", params={"rate": 1.0}, timeout=5.0)
    assert r.status_code == 503
```

`rate=1.0` — deterministic 503 for the test.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| Connection refused | docker compose ps |
| responses 404 | exact URL match |
| skip integration | RUN_INTEGRATION=1 |

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | responses tests without a mock client inject |
| 2 | live health + aggregate |
| 3 | deterministic /fail test |
| 4 | unit job without docker green |

## Cleanup

Save the integration tests.

## Self-check questions

1. responses vs inject mock — the trade-off?
2. Why rate=1.0?

Next: [22-testcontainers](22-testcontainers.md).
