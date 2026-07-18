# 11. Лаба: Fake HTTP client для UserService

## Цель лабы

Реализовать **StubHttpClient** (или Fake) без MagicMock; покрыть 3 URL сценария; сравнить читаемость с [08-lab-mocking](08-lab-mocking.md).

## Предварительно

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
```

Теория: [10-fakes-stubs](10-fakes-stubs.md).

---

## Задание 1. StubHttpClient

`tests/fakes/http_stub.py`:

```python
class StubResponse:
    def __init__(self, payload: dict, status_ok: bool = True):
        self._payload = payload
        self._ok = status_ok

    def json(self):
        return self._payload

    def raise_for_status(self):
        if not self._ok:
            import httpx
            raise httpx.HTTPStatusError("error", request=None, response=None)


class StubHttpClient:
    def __init__(self, routes: dict[str, dict]):
        self._routes = routes
        self.calls: list[str] = []

    def get(self, url: str) -> StubResponse:
        self.calls.append(url)
        if url not in self._routes:
            return StubResponse({}, status_ok=False)
        entry = self._routes[url]
        return StubResponse(entry["json"], status_ok=entry.get("ok", True))
```

---

## Задание 2. Tests с fake

`tests/test_users_fake.py`:

```python
from shop.users import UserService
from tests.fakes.http_stub import StubHttpClient


def test_get_user_via_stub():
    client = StubHttpClient({
        "http://api.test/users/7": {
            "json": {"id": 7, "email": "seven@shop.local", "active": True},
        },
    })
    svc = UserService("http://api.test", client=client)
    user = svc.get_user(7)
    assert user.email == "seven@shop.local"
    assert client.calls == ["http://api.test/users/7"]
```

**Что увидите:** spy через `client.calls` без mock assert API.

---

## Задание 3. Unknown user 404

```python
import httpx
import pytest


def test_unknown_user_raises():
    client = StubHttpClient({})
    svc = UserService("http://api.test", client=client)
    with pytest.raises(httpx.HTTPStatusError):
        svc.get_user(999)
```

---

## Задание 4. Таблица users

```python
import pytest


@pytest.mark.parametrize("uid,email", [(1, "a@x.c"), (2, "b@y.d")])
def test_multiple_users(uid, email):
    url = f"http://api.test/users/{uid}"
    client = StubHttpClient({
        url: {"json": {"id": uid, "email": email, "active": True}},
    })
    user = UserService("http://api.test", client=client).get_user(uid)
    assert user.email == email
```

---

## Задание 5. Review сравнение

Откройте `test_users.py` (mock) и `test_users_fake.py` — какой проще **review** для junior?

**Что увидите:** fake явнее; mock короче для one-off.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| import tests.fakes | добавьте `tests/fakes/__init__.py` (пустой) |
| HTTPStatusError None request | для lab достаточно; в prod mock request |

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | StubHttpClient без MagicMock |
| 2 | calls list проверяется |
| 3 | parametrize 2+ users |
| 4 | Можете объяснить fake vs mock |

## Уборка

Сохраните `tests/fakes/` и `test_users_fake.py`.

## Вопросы для самопроверки

1. Stub или fake — что вы написали?
2. Когда вернуться к MagicMock?

Далее: [12-conftest-layout](12-conftest-layout.md).
