# 17. Lab: property tests for pricing

## Lab goal

Write ≥3 **Hypothesis** properties for `apply_discount` and `bulk_price`; reproduce a seed on failure.

## Prerequisites

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
```

Theory: [16-hypothesis](16-hypothesis.md).

---

## Task 1. tests/unit/test_pricing_hypothesis.py

```python
from decimal import Decimal

from hypothesis import given, strategies as st

from shop.pricing import apply_discount, bulk_price


@given(
    price=st.decimals(min_value=0, max_value=50_000, places=2),
    percent=st.integers(min_value=0, max_value=100),
)
def test_discount_result_bounded(price, percent):
    result = apply_discount(price, percent)
    assert Decimal("0") <= result <= price


@given(
    percent=st.integers(min_value=0, max_value=100),
)
def test_zero_price_always_zero(percent):
    assert apply_discount(Decimal("0"), percent) == Decimal("0.00")


@given(
    unit=st.decimals(min_value=Decimal("0.01"), max_value=1000, places=2),
    qty=st.integers(min_value=1, max_value=100),
)
def test_bulk_total_positive(unit, qty):
    assert bulk_price(unit, qty) > 0
```

**What you'll see:** each test — hundreds of examples (Hypothesis output).

---

## Task 2. Monotonicity by percent

```python
from hypothesis import assume


@given(
    price=st.decimals(min_value=Decimal("1"), max_value=1000, places=2),
    p1=st.integers(min_value=0, max_value=99),
    p2=st.integers(min_value=0, max_value=100),
)
def test_higher_discount_lower_or_equal_price(price, p1, p2):
    assume(p1 <= p2)
    r1 = apply_discount(price, p1)
    r2 = apply_discount(price, p2)
    assert r1 >= r2
```

---

## Task 3. Reproducible seed

On an intentional fail add `@seed(12345)` or run:

```bash
pytest tests/unit/test_pricing_hypothesis.py -v --hypothesis-show-statistics
```

Hypothesis prints the **seed** for replay.

---

## Task 4. CI marker slow (optional)

```python
import pytest
from hypothesis import settings

@pytest.mark.slow
@settings(max_examples=1000)
@given(...)
def test_heavy(...):
    ...
```

MR: `pytest -m "not slow"`.

---

## Task 5. Combined suite

```bash
pytest tests/unit/test_pricing.py tests/unit/test_pricing_hypothesis.py -v
```

**What you'll see:** unit examples + generated — complementary.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| FailedHealthCheck | strategy too narrow — widen or assume |
| Decimal context | use `places=2` consistently |
| bulk_price ValueError | qty min_value=1 |

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | ≥4 @given tests |
| 2 | monotonicity property |
| 3 | all green |
| 4 | you understand shrinking on the demo fail |

## Cleanup

Save `test_pricing_hypothesis.py`.

## Self-check questions

1. What invariant would you add for tier2 bulk?
2. Hypothesis vs 50 parametrize rows?

Next: [18-integration-db](18-integration-db.md).
