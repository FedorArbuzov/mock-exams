# 08. Лаба: mock HTTP для UserService

## Цель лабы

Покрыть [`UserService`](examples/src/shop/users.py) unit-тестами: happy path, HTTP error, проверка **URL** и **context manager**.

## Предварительно

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
```

Теория: [07-mocking-patch](07-mocking-patch.md).

---

## Задание 1. Happy path с inject mock

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

**Что увидите:** 1 passed, без сети.

---

## Задание 2. HTTPStatusError

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

**Что увидите:** exception пробрасывается — service не глотает ошибки.

---

## Задание 3. context manager close

```python
def test_context_manager_closes_client():
    mock_client = MagicMock()
    with UserService("http://api.test", client=mock_client) as svc:
        assert svc is not None
    mock_client.close.assert_called_once()
```

Для owned client (без inject) — patch `httpx.Client` и assert `close` на instance.

**Что увидите:** teardown вызывается при `with`.

---

## Задание 4. pytest-mock вариант

Перепишите happy path через `mocker`:

```python
def test_get_user_mocker(mocker):
    mock_client = mocker.MagicMock()
    ...
```

**Что увидите:** тот же результат; patch автоматически снимается.

---

## Задание 5. inactive user

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

**Что увидите:** парсинг не фильтрует inactive — поведение задокументировано test.

---

## Если не working

| Симптом | Действие |
|---------|----------|
| assert_called wrong URL | trailing slash в base_url |
| JSON KeyError | mock json.return_value incomplete |
| close not called | используйте `with UserService(...)` |

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | ≥4 tests в test_users.py |
| 2 | assert_called на get |
| 3 | HTTP error covered |
| 4 | Без live network |

## Уборка

Сохраните `tests/test_users.py`.

## Вопросы для самопроверки

1. Почему inject лучше patch?
2. Что проверяет `raise_for_status` в prod коде?
3. Как бы вы протестировали timeout?

Далее: [09-monkeypatch-capsys](09-monkeypatch-capsys.md).
