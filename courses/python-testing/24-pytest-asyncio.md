# 24. pytest-asyncio: async tests и fixtures

## Введение: «забыли await — test pass»

Без `pytest-asyncio` coroutine test **не выполняется** — warning «coroutine was never awaited». Async production code требует async tests с **httpx AsyncClient**, **asyncpg**.

## Что вы узнаете

- **`asyncio_mode = auto`** в pyproject.
- **`@pytest.mark.asyncio`** и async fixtures.
- **AsyncMock** для async dependencies.
- Связь с [`python-async/27`](../python-async/27-pytest-asyncio.md) — углубление.

---

## Config

[`examples/pyproject.toml`](examples/pyproject.toml):

```toml
[tool.pytest.ini_options]
asyncio_mode = "auto"
asyncio_default_fixture_loop_scope = function
```

---

## Test async_utils

[`async_utils.py`](examples/src/shop/async_utils.py):

```python
import pytest
from decimal import Decimal
from shop.async_utils import async_discounted_total


@pytest.mark.asyncio
async def test_async_discounted_total_empty():
    total = await async_discounted_total([], 10)
    assert total == Decimal("0")


@pytest.mark.asyncio
async def test_async_discounted_total_sums():
    prices = [Decimal("100"), Decimal("50")]
    total = await async_discounted_total(prices, 10)
    assert total == Decimal("90") + Decimal("45")  # 135.00
```

---

## Async fixture

```python
import pytest
import httpx


@pytest.fixture
async def async_client():
    async with httpx.AsyncClient(base_url="http://localhost:8095") as client:
        yield client
```

Requires pytest-asyncio ≥0.24 for async fixtures.

---

## AsyncMock

```python
from unittest.mock import AsyncMock


@pytest.mark.asyncio
async def test_async_service(mocker):
    mock_fetch = mocker.patch("myapp.fetch", new_callable=AsyncMock)
    mock_fetch.return_value = {"ok": True}
    ...
```

---

## loop scope pitfalls

| Problem | Fix |
|---------|-----|
| «Event loop is closed» | function scope loop |
| leaked tasks | await cleanup in fixture |
| sync test calls async | use asyncio.run in sync test — avoid |

---

## vs TestClient

| | TestClient (FastAPI) | httpx AsyncClient |
|---|---------------------|-------------------|
| Style | sync test | async test |
| App | ASGI in-process | HTTP or transport |

См. [`fastapi/30-testing`](../fastapi/30-testing.md).

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| async def test без plugin | not awaited | pytest-asyncio |
| shared loop + closed | flaky | function scope |
| blocking sync in async test | ok but slow | to_thread |

## На собеседовании

- Как pytest запускает async test?
- Async fixture lifecycle?

## Резюме

pytest-asyncio + auto mode. async tests для async_utils и httpx. AsyncMock для async patches. function loop scope default.

Далее: [25-lab-async-tests](25-lab-async-tests.md).
