# 03. Лаба: первые unit-тесты pricing

## Цель лабы

Написать **parametrize**-набор для `apply_discount` и `bulk_price`, покрыть **ValueError** на границах, прогнать **coverage** на модуле — фундамент всего suite.

## Предварительно

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

Теория: [02-pytest-basics](02-pytest-basics.md).

---

## Задание 1. Файл test_pricing.py

Создайте `tests/test_pricing.py`:

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

**Что увидите:** `4 passed` — один test function, четыре строки parametrize.

---

## Задание 2. ValueError на границах

Добавьте:

```python
@pytest.mark.parametrize("percent", [-1, 101])
def test_apply_discount_bad_percent(percent):
    with pytest.raises(ValueError, match="percent"):
        apply_discount(Decimal("10"), percent)


def test_apply_discount_negative_price():
    with pytest.raises(ValueError, match="price"):
        apply_discount(Decimal("-0.01"), 0)
```

**Что увидите:** ещё 3 passed; при удалении `match=` test всё ещё ловит ValueError, но слабее проверяет контракт.

---

## Задание 3. bulk_price и tier2

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

**Что увидите:** tier2 срабатывает при `quantity >= 10` (см. [`pricing.py`](examples/src/shop/pricing.py)).

---

## Задание 4. CLI и coverage

```bash
pytest tests/test_pricing.py -v
pytest -k bulk -v
pytest --cov=shop.pricing --cov-report=term-missing tests/test_pricing.py
```

**Что увидите:** report `term-missing` — красные строки, если что-то не покрыто (например ветка `quantity <= 0`).

---

## Задание 5. Намеренный red → green

1. Временно измените expected в одном test на неверное значение.
2. Запустите `pytest -v` — убедитесь, что diff понятен.
3. Верните correct assert.

**Что увидите:** pytest показывает `assert Decimal('90.00') == Decimal('99.00')` с diff.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| `ModuleNotFoundError: shop` | `pip install -e ".[dev]"` из `examples/` |
| collected 0 items | файл должен быть `test_pricing.py` |
| `AssertionError` на Decimal | сравнивайте `Decimal("90.00")`, не float |
| venv не активен | `which python` / `where python` → `.venv` |

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | ≥10 tests passed в `test_pricing.py` |
| 2 | parametrize + `pytest.raises` используются |
| 3 | coverage `shop.pricing` ≥ 90% |
| 4 | Понимаете diff при intentional fail |

## Уборка

Файл `tests/test_pricing.py` **оставьте** — нужен в capstone.

## Вопросы для самопроверки

1. Сколько test **functions** vs test **invocations** при parametrize?
2. Зачем `match=` в `pytest.raises`?
3. Почему `Decimal`, а не `float`?

Далее: [04-fixtures](04-fixtures.md).
