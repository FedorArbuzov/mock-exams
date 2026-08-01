# 25. Lab: async tests for async_utils

## Lab goal

Cover [`async_discounted_total`](examples/src/shop/async_utils.py); add a **gather** test; optional **async httpx** integration.

## Prerequisites

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
```

Theory: [24-pytest-asyncio](24-pytest-asyncio.md).

---

## Task 1. tests/unit/test_async_utils.py

```python
from decimal import Decimal

import pytest

from shop.async_utils import async_discounted_total


@pytest.mark.asyncio
async def test_empty_list():
    assert await async_discounted_total([], 0) == Decimal("0")


@pytest.mark.asyncio
async def test_single_price():
    assert await async_discounted_total([Decimal("100.00")], 10) == Decimal("90.00")


@pytest.mark.asyncio
async def test_multiple_prices():
    prices = [Decimal("100"), Decimal("200")]
    expected = Decimal("90") + Decimal("180")
    assert await async_discounted_total(prices, 10) == expected
```

---

## Task 2. parallel coroutines

```python
import asyncio


@pytest.mark.asyncio
async def test_two_totals_in_parallel():
    t1 = async_discounted_total([Decimal("10")], 0)
    t2 = async_discounted_total([Decimal("20")], 50)
    r1, r2 = await asyncio.gather(t1, t2)
    assert r1 == Decimal("10.00")
    assert r2 == Decimal("10.00")
```

---

## Task 3. invalid percent propagates

```python
@pytest.mark.asyncio
async def test_invalid_percent_raises():
    with pytest.raises(ValueError):
        await async_discounted_total([Decimal("10")], 200)
```

---

## Task 4. async httpx fixture (integration)

`tests/integration/conftest.py`:

```python
@pytest.fixture
async def async_live_client(live_base_url):
    import httpx
    async with httpx.AsyncClient(base_url=live_base_url, timeout=10.0) as client:
        yield client
```

```python
@pytest.mark.integration
@pytest.mark.asyncio
async def test_async_health(async_live_client):
    r = await async_live_client.get("/health")
    assert r.status_code == 200
```

---

## Task 5. coverage async_utils

```bash
pytest tests/unit/test_async_utils.py --cov=shop.async_utils --cov-report=term-missing
```

Target 100% on the module.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| PytestUnhandledCoroutineWarning | asyncio_mode auto |
| async fixture errors | pytest-asyncio >=0.24 |

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | ≥5 async tests |
| 2 | gather test |
| 3 | async_utils 100% cov |
| 4 | optional async integration |

## Cleanup

—

## Self-check questions

1. Why asyncio in async_discounted_total if it's sleep(0)?
2. When AsyncClient vs sync?

Next: [26-ci-gitlab](26-ci-gitlab.md).
