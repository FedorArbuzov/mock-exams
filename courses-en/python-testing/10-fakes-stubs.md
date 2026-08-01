# 10. Test doubles: stub, fake, spy, mock

## Intro: "MagicMock for everything — refactoring is impossible"

The team mocked every method of `Cart` — the tests are green, but they **don't check the real total calculation**. Test doubles per **Fowler**: different types of substitutes with different **strictness**.

## What you'll learn

- **Stub, fake, spy, mock** — definitions and when to use which.
- **Fake in-memory repository** vs MagicMock.
- **Spy** — a real object + recording calls.
- When a double is **too clever**.

---

## Taxonomy

| Double | Role | Example |
|--------|------|--------|
| **Stub** | fixed answers | `get_user → User(id=1)` |
| **Fake** | a working simplified implementation | dict instead of PostgreSQL |
| **Spy** | real + log calls | wrap httpx client |
| **Mock** | stub + **assert expectations** | `assert_called_once` |
| **Dummy** | argument placeholder | `None` where unused |

---

## Stub for HTTP

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

Simpler than MagicMock for **table-driven** scenarios — reads well in review.

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

Record without replacing the return — an audit trail.

---

## Mock vs fake — the choice

| Criterion | MagicMock | Fake |
|----------|-----------|------|
| Speed to write | fast | slower |
| Refactor resilience | low | higher |
| Readability | `.return_value` chains | explicit code |
| Complex behavior | side_effect | state machine |

**Rule:** mock the **boundary** (HTTP, clock, random); fake the **storage**; don't mock **domain math** (`apply_discount`).

---

## pytest-mock vs a hand-rolled fake

[`UserService`](examples/src/shop/users.py) — inject `client`: stub/fake/mock **all** work through the constructor.

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| Mock pricing in a cart test | zero value | test real pricing |
| Fake duplicates prod bugs | drift | share interface / protocol |
| Spy on everything | overhead | only critical paths |

## Interview questions

- The difference between **fake vs mock**?
- An example of a **stub** in your project?

## Summary

Doubles aren't only MagicMock. A fake repository for integration-lite; a stub for HTTP tables; a mock — assert calls. Domain logic — real code in the tests.

Next: [11-lab-doubles](11-lab-doubles.md).
