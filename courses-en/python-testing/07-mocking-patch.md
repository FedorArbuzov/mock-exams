# 07. unittest.mock, patch, MagicMock, pytest-mock

## Intro: "a unit test hits the prod API"

`UserService.get_user()` calls `httpx.Client.get()` — a unit test without a mock **depends on the network**, fails offline, and is slow. A mock replaces the **boundary** between your code and the outside world.

## What you'll learn

- **`MagicMock`** and `return_value` chains.
- **`patch`** — where to patch (`where used`).
- **`pytest-mock`** and the `mocker` fixture.
- **`side_effect`** for exceptions and sequences.
- Asserting **call_args** — checking the call contract.

---

## MagicMock without patch

[`users.py`](examples/src/shop/users.py) takes a `client` in the constructor — **inject a mock**:

```python
from unittest.mock import MagicMock
from shop.users import UserService


def test_get_user_happy_path():
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "id": 1,
        "email": "demo@course.local",
        "active": True,
    }
    mock_response.raise_for_status = MagicMock()
    mock_client.get.return_value = mock_response

    svc = UserService("http://fake.example", client=mock_client)
    user = svc.get_user(1)

    assert user.email == "demo@course.local"
    assert user.active is True
    mock_client.get.assert_called_once_with("http://fake.example/users/1")
```

**Dependency injection** is the best mock-friendly design.

---

## patch: substitution by path

When the client is created internally:

```python
from unittest.mock import patch, MagicMock


@patch("shop.users.httpx.Client")
def test_get_user_patches_class(MockClient):
    instance = MockClient.return_value
    instance.get.return_value.json.return_value = {
        "id": 2, "email": "b@c.d", "active": False,
    }
    instance.get.return_value.raise_for_status = MagicMock()

    svc = UserService("http://fake.example")
    user = svc.get_user(2)
    assert user.id == 2
```

**patch rule:** patch where the name is **used** (`shop.users.httpx.Client`), not where it's defined (`httpx.Client`).

---

## side_effect

```python
import httpx


def test_http_error():
    mock_client = MagicMock()
    mock_client.get.side_effect = httpx.HTTPStatusError(
        "404", request=MagicMock(), response=MagicMock()
    )
    svc = UserService("http://fake", client=mock_client)
    with pytest.raises(httpx.HTTPStatusError):
        svc.get_user(999)
```

| side_effect | Effect |
|-------------|--------|
| Exception class/instance | raise when called |
| list | sequential return/raise |
| function | dynamic behavior |

---

## pytest-mock

```python
def test_with_mocker(mocker):
    mock_get = mocker.patch("httpx.Client.get")
    mock_get.return_value.json.return_value = {"id": 1, "email": "a@b.c", "active": True}
    mock_get.return_value.raise_for_status = mocker.Mock()
    ...
```

`mocker` — auto **unpatch** after the test; less boilerplate.

---

## spec and autospec

```python
mock_client = MagicMock(spec=httpx.Client)
```

`spec` — the mock won't accept a nonexistent method — it catches the typo `mock_client.geet()`.

---

## Over-mocking

| Good | Bad |
|--------|-------|
| mock HTTP client | mock `apply_discount` inside a cart test |
| assert call URL once | mock return without asserting calls |
| inject dependency | `@patch` 5 levels of nesting |

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| patch wrong path | mock doesn't take effect | where used |
| mock.return_value = mock | an infinite chain | explicit return_value |
| No assert_called | test green on a no-op | assert calls |
| Mock internal logic | refactor breaks everything | mock I/O only |

## Interview questions

- **patch where used** — give an example.
- Mock vs **fake** — when which?
- Why **spec=**?

## Summary

A mock is the I/O boundary. Inject a mock client when possible; otherwise patch. pytest-mock simplifies cleanup. Assert not only the return, but also the **calls**.

Next: [08-lab-mocking](08-lab-mocking.md).
