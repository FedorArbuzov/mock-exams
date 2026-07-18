# 17. Лаба: property tests для pricing

## Цель лабы

Написать ≥3 **Hypothesis** properties для `apply_discount` и `bulk_price`; воспроизвести seed при падении.

## Предварительно

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
```

Теория: [16-hypothesis](16-hypothesis.md).

---

## Задание 1. tests/unit/test_pricing_hypothesis.py

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

**Что увидите:** каждый test — hundreds of examples (Hypothesis output).

---

## Задание 2. Monotonicity по percent

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

## Задание 3. Reproducible seed

При intentional fail добавьте `@seed(12345)` или запустите:

```bash
pytest tests/unit/test_pricing_hypothesis.py -v --hypothesis-show-statistics
```

Hypothesis печатает **seed** для replay.

---

## Задание 4. CI marker slow (optional)

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

## Задание 5. Combined suite

```bash
pytest tests/unit/test_pricing.py tests/unit/test_pricing_hypothesis.py -v
```

**Что увидите:** unit examples + generated — complementary.

---

## Если не working

| Симптом | Действие |
|---------|----------|
| FailedHealthCheck | strategy too narrow — widen or assume |
| Decimal context | use `places=2` consistently |
| bulk_price ValueError | qty min_value=1 |

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | ≥4 @given tests |
| 2 | monotonicity property |
| 3 | all green |
| 4 | понимаете shrinking на demo fail |

## Уборка

Сохраните `test_pricing_hypothesis.py`.

## Вопросы для самопроверки

1. Какой invariant вы бы добавили для tier2 bulk?
2. Hypothesis vs 50 parametrize rows?

Далее: [18-integration-db](18-integration-db.md).
