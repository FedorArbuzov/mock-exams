# 03. Lab: first pricing unit tests

## Lab goal

Write a **parametrize** set for `apply_discount` and `bulk_price`, cover **ValueError** at the boundaries, run **coverage** on the module — the foundation of the whole suite.

## Prerequisites

```bash
cd courses/python-testing/examples
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate
pip install -e ".[dev]"
pytest -v
```

Theory: [02-pytest-basics](02-pytest-basics.md).

---

## Task 1. The test_pricing.py file

Create `tests/test_pricing.py`:

```python
from decimal import Decimal

import pytest

from shop.pricing import apply_discount, bulk_price


@pytest.mark.parametrize(
    "price,percent,expected",
    [
        (Decimal("100.00"), 10, Decimal("90.00")),
        (Decimal("50.00"), 0, Decimal("50.00")),
        (Decimal("99.99"), 50, Decimal("50.00")),
        (Decimal("10.00"), 100, Decimal("0.00")),
    ],
)
def test_apply_discount_cases(price, percent, expected):
    assert apply_discount(price, percent) == expected
```

**What you'll see:** `4 passed` — one test function, four parametrize rows.

---

## Task 2. ValueError at the boundaries

Add:

```python
@pytest.mark.parametrize("percent", [-1, 101])
def test_apply_discount_bad_percent(percent):
    with pytest.raises(ValueError, match="percent"):
        apply_discount(Decimal("10"), percent)


def test_apply_discount_negative_price():
    with pytest.raises(ValueError, match="price"):
        apply_discount(Decimal("-0.01"), 0)
```

**What you'll see:** 3 more passed; if you remove `match=` the test still catches ValueError, but checks the contract more weakly.

---

## Task 3. bulk_price and tier2

```python
def test_bulk_no_discount_below_tier():
    assert bulk_price(Decimal("10.00"), 5) == Decimal("50.00")


def test_bulk_tier_discount_at_10():
    # 10 × 10 = 100, minus 5% = 95.00
    assert bulk_price(Decimal("10.00"), 10) == Decimal("95.00")


def test_bulk_zero_quantity():
    with pytest.raises(ValueError):
        bulk_price(Decimal("10"), 0)
```

**What you'll see:** tier2 triggers when `quantity >= 10` (see [`pricing.py`](examples/src/shop/pricing.py)).

---

## Task 4. CLI and coverage

```bash
pytest tests/test_pricing.py -v
pytest -k bulk -v
pytest --cov=shop.pricing --cov-report=term-missing tests/test_pricing.py
```

**What you'll see:** the `term-missing` report — red lines if something is not covered (for example the `quantity <= 0` branch).

---

## Task 5. Intentional red → green

1. Temporarily change the expected value in one test to a wrong value.
2. Run `pytest -v` — make sure the diff is clear.
3. Restore the correct assert.

**What you'll see:** pytest shows `assert Decimal('90.00') == Decimal('99.00')` with a diff.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| `ModuleNotFoundError: shop` | `pip install -e ".[dev]"` from `examples/` |
| collected 0 items | the file must be `test_pricing.py` |
| `AssertionError` on Decimal | compare `Decimal("90.00")`, not float |
| venv not active | `which python` / `where python` → `.venv` |

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | ≥10 tests passed in `test_pricing.py` |
| 2 | parametrize + `pytest.raises` are used |
| 3 | coverage of `shop.pricing` ≥ 90% |
| 4 | You understand the diff on an intentional fail |

## Cleanup

**Keep** the `tests/test_pricing.py` file — it's needed in the capstone.

## Self-check questions

1. How many test **functions** vs test **invocations** with parametrize?
2. Why `match=` in `pytest.raises`?
3. Why `Decimal`, not `float`?

Next: [04-fixtures](04-fixtures.md).
