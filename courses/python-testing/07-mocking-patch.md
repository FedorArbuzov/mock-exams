# 07. unittest.mock, patch, MagicMock, pytest-mock

## Введение: «unit-тест ходит в prod API»

`UserService.get_user()` вызывает `httpx.Client.get()` — unit-test без mock **зависит от сети**, падает offline и медленный. Mock подменяет **границу** между вашим кодом и внешним миром.

## Что вы узнаете

- **`MagicMock`** и цепочки `return_value`.
- **`patch`** — где патчить (`where used`).
- **`pytest-mock`** fixture `mocker`.
- **`side_effect`** для исключений и последовательностей.
- Assert **call_args** — проверка контракта вызова.

---

## MagicMock без patch

[`users.py`](examples/src/shop/users.py) принимает `client` в конструктор — **inject mock**:

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

**Dependency injection** — лучший mock-friendly design.

---

## patch: подмена по пути

Когда client создаётся внутри:

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

**Правило patch:** патчите там, где имя **используется** (`shop.users.httpx.Client`), не где определено (`httpx.Client`).

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

| side_effect | Эффект |
|-------------|--------|
| Exception class/instance | raise при вызове |
| list | поочерёдные return/raise |
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

`mocker` — auto **unpatch** после test; меньше boilerplate.

---

## spec и autospec

```python
mock_client = MagicMock(spec=httpx.Client)
```

`spec` — mock не примет несуществующий метод — ловит typo `mock_client.geet()`.

---

## Over-mocking

| Хорошо | Плохо |
|--------|-------|
| mock HTTP client | mock `apply_discount` внутри cart test |
| assert call URL once | mock return без assert calls |
| inject dependency | `@patch` 5 уровней вложенности |

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| patch wrong path | mock не срабатывает | where used |
| mock.return_value = mock | бесконечная цепочка | явные return_value |
| Нет assert_called | test green при no-op | assert calls |
| Mock internal logic | refactor ломает всё | mock I/O only |

## На собеседовании

- **patch where used** — пример.
- Mock vs **fake** — когда что?
- Зачем **spec=**?

## Резюме

Mock — граница I/O. Inject mock client когда возможно; иначе patch. pytest-mock упрощает cleanup. Assert не только return, но и **вызовы**.

Далее: [08-lab-mocking](08-lab-mocking.md).
