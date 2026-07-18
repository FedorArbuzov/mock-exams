# 10. Test doubles: stub, fake, spy, mock

## Введение: «MagicMock на всё — refactor невозможен»

Команда замockала каждый метод `Cart` — тесты зелёные, но **не проверяют реальное сложение total**. Test doubles по **Fowler**: разные типы подмен с разной **строгостью**.

## Что вы узнаете

- **Stub, fake, spy, mock** — определения и когда что.
- **Fake in-memory repository** vs MagicMock.
- **Spy** — real object + запись вызовов.
- Когда double **слишком умный**.

---

## Таксономия

| Double | Роль | Пример |
|--------|------|--------|
| **Stub** | фиксированные ответы | `get_user → User(id=1)` |
| **Fake** | рабочая упрощённая реализация | dict вместо PostgreSQL |
| **Spy** | real + log calls | wrap httpx client |
| **Mock** | stub + **assert expectations** | `assert_called_once` |
| **Dummy** | заполнитель аргумента | `None` где не используется |

---

## Stub для HTTP

```python
class StubHttpClient:
    def __init__(self, responses: dict[str, dict]):
        self._responses = responses

    def get(self, url: str):
        class R:
            def __init__(self, data):
                self._data = data
            def json(self):
                return self._data
            def raise_for_status(self):
                pass
        return R(self._responses[url])
```

Проще MagicMock для **табличных** сценариев — читается в review.

---

## Fake repository

```python
class FakeCartRepository:
    def __init__(self):
        self._storage: dict[str, list] = {}

    def save(self, user_id: str, cart) -> None:
        self._storage[user_id] = list(cart.items)

    def load(self, user_id: str):
        return self._storage.get(user_id, [])
```

Integration-lite: **real cart logic** + fake persistence.

---

## Spy

```python
class SpyClient:
    def __init__(self, real_client):
        self._real = real_client
        self.calls: list[str] = []

    def get(self, url: str):
        self.calls.append(url)
        return self._real.get(url)
```

Record без подмены return — audit trail.

---

## Mock vs fake — выбор

| Критерий | MagicMock | Fake |
|----------|-----------|------|
| Скорость написания | быстро | дольше |
| Refactor resilience | низкая | выше |
| Читаемость | цепочки `.return_value` | явный код |
| Сложное поведение | side_effect | state machine |

**Правило:** mock **границу** (HTTP, clock, random); fake **storage**; не mock **domain math** (`apply_discount`).

---

## pytest-mock vs hand-rolled fake

[`UserService`](examples/src/shop/users.py) — inject `client`: stub/fake/mock **все** работают через constructor.

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| Mock pricing in cart test | zero value | test real pricing |
| Fake duplicate prod bugs | drift | share interface / protocol |
| Spy on everything | overhead | только critical paths |

## На собеседовании

- Разница **fake vs mock**?
- Пример **stub** в вашем проекте?

## Резюме

Doubles — не только MagicMock. Fake repository для integration-lite; stub для таблиц HTTP; mock — assert calls. Domain logic — real code in tests.

Далее: [11-lab-doubles](11-lab-doubles.md).
