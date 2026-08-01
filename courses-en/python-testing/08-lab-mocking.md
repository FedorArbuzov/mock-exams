# 08. Lab: mock HTTP for UserService

## Lab goal

Cover [`UserService`](examples/src/shop/users.py) with unit tests: happy path, HTTP error, checking the **URL** and the **context manager**.

## Prerequisites

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
```

Theory: [07-mocking-patch](07-mocking-patch.md).

---

## Task 1. Happy path with an injected mock

`tests/test_users.py`:

```python
from unittest.mock import MagicMock

from shop.users import UserService


def test_get_user_returns_user():
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "id": 42,
        "email": "user@shop.local",
        "active": True,
    }
    mock_resp.raise_for_status = MagicMock()
    mock_client.get.return_value = mock_resp

    svc = UserService("http://api.test", client=mock_client)
    user = svc.get_user(42)

    assert user.id == 42
    assert user.email == "user@shop.local"
    mock_client.get.assert_called_once_with("http://api.test/users/42")
```

**What you'll see:** 1 passed, no network.

---

## Task 2. HTTPStatusError

```python
import httpx
import pytest
from unittest.mock import MagicMock

from shop.users import UserService


def test_get_user_raises_on_http_error():
    mock_client = MagicMock()
    mock_client.get.side_effect = httpx.HTTPStatusError(
        "503",
        request=MagicMock(),
        response=MagicMock(status_code=503),
    )
    svc = UserService("http://api.test", client=mock_client)

    with pytest.raises(httpx.HTTPStatusError):
        svc.get_user(1)
```

**What you'll see:** the exception propagates — the service doesn't swallow errors.

---

## Task 3. context manager close

```python
def test_context_manager_closes_client():
    mock_client = MagicMock()
    with UserService("http://api.test", client=mock_client) as svc:
        assert svc is not None
    mock_client.close.assert_called_once()
```

For an owned client (without inject) — patch `httpx.Client` and assert `close` on the instance.

**What you'll see:** teardown is called on `with`.

---

## Task 4. The pytest-mock variant

Rewrite the happy path with `mocker`:

```python
def test_get_user_mocker(mocker):
    mock_client = mocker.MagicMock()
    ...
```

**What you'll see:** the same result; the patch is removed automatically.

---

## Task 5. inactive user

```python
def test_inactive_user_still_parsed():
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_resp.json.return_value = {
        "id": 1, "email": "off@shop.local", "active": False,
    }
    mock_resp.raise_for_status = MagicMock()
    mock_client.get.return_value = mock_resp

    user = UserService("http://api.test", client=mock_client).get_user(1)
    assert user.active is False
```

**What you'll see:** parsing doesn't filter out inactive — the behavior is documented by the test.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| assert_called wrong URL | trailing slash in base_url |
| JSON KeyError | mock json.return_value incomplete |
| close not called | use `with UserService(...)` |

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | ≥4 tests in test_users.py |
| 2 | assert_called on get |
| 3 | HTTP error covered |
| 4 | No live network |

## Cleanup

Save `tests/test_users.py`.

## Self-check questions

1. Why is inject better than patch?
2. What does `raise_for_status` check in prod code?
3. How would you test a timeout?

Next: [09-monkeypatch-capsys](09-monkeypatch-capsys.md).
