# 11. Lab: a Fake HTTP client for UserService

## Lab goal

Implement a **StubHttpClient** (or Fake) without MagicMock; cover 3 URL scenarios; compare readability with [08-lab-mocking](08-lab-mocking.md).

## Prerequisites

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
```

Theory: [10-fakes-stubs](10-fakes-stubs.md).

---

## Task 1. StubHttpClient

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

## Task 2. Tests with the fake

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

**What you'll see:** a spy via `client.calls` without the mock assert API.

---

## Task 3. Unknown user 404

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

## Task 4. A table of users

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

## Task 5. Review comparison

Open `test_users.py` (mock) and `test_users_fake.py` — which is easier to **review** for a junior?

**What you'll see:** the fake is more explicit; the mock is shorter for one-off cases.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| import tests.fakes | add `tests/fakes/__init__.py` (empty) |
| HTTPStatusError None request | fine for the lab; in prod mock the request |

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | StubHttpClient without MagicMock |
| 2 | the calls list is checked |
| 3 | parametrize 2+ users |
| 4 | You can explain fake vs mock |

## Cleanup

Save `tests/fakes/` and `test_users_fake.py`.

## Self-check questions

1. A stub or a fake — which did you write?
2. When to go back to MagicMock?

Next: [12-conftest-layout](12-conftest-layout.md).
