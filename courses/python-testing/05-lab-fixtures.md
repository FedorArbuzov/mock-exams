# 05. Лаба: fixtures для Cart

## Цель лабы

Перенести setup Cart в **yield-fixture**, доказать **изоляцию** между tests, добавить **composed fixture** `filled_cart`.

## Предварительно

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
pytest tests/test_pricing.py -v   # из прошлой лабы
```

Теория: [04-fixtures](04-fixtures.md).

---

## Задание 1. cart fixture в conftest.py

Обновите [`tests/conftest.py`](examples/tests/conftest.py):

```python
import pytest
from shop.cart import Cart


@pytest.fixture
def cart() -> Cart:
    c = Cart()
    yield c
    c.clear()
```

Удалите старый `empty_cart` если дублирует.

**Что увидите:** fixture доступен всем tests в `tests/` без импорта.

---

## Задание 2. tests/test_cart.py

```python
from decimal import Decimal


def test_new_cart_is_empty(cart):
    assert cart.total() == 0
    assert cart.items == []


def test_add_single_sku(cart):
    cart.add("BOOK-1", Decimal("19.99"), 1)
    assert cart.total() == Decimal("19.99")


def test_add_same_sku_merges_quantity(cart):
    cart.add("BOOK-1", Decimal("10.00"), 1)
    cart.add("BOOK-1", Decimal("10.00"), 2)
    assert len(cart.items) == 1
    assert cart.items[0].quantity == 3
    assert cart.total() == Decimal("30.00")
```

**Что увидите:** 3 passed; порядок tests не важен.

---

## Задание 3. filled_cart fixture

В `conftest.py`:

```python
@pytest.fixture
def filled_cart(cart):
    cart.add("SKU-A", Decimal("100.00"), 1)
    cart.add("SKU-B", Decimal("50.00"), 2)
    return cart
```

Test:

```python
def test_filled_total(filled_cart):
    # 100 + 2*50 = 200, без tier2 (< 10 items per sku logic)
    assert filled_cart.total() == Decimal("200.00")
```

**Что увидите:** `filled_cart` переиспользует `cart` fixture chain.

---

## Задание 4. Доказательство изоляции

Добавьте «плохой» test (временно):

```python
def test_mutate_for_demo(cart):
    cart.add("LEAK", Decimal("1"), 1)
    assert cart.total() == Decimal("1.00")
```

Запустите `pytest tests/test_cart.py -v` **дважды** в разном порядке:

```bash
pytest tests/test_cart.py::test_new_cart_is_empty tests/test_cart.py::test_mutate_for_demo -v
pytest tests/test_cart.py::test_mutate_for_demo tests/test_cart.py::test_new_cart_is_empty -v
```

**Что увидите:** оба порядка green — teardown `clear()` после каждого test.

Удалите `test_mutate_for_demo` после демонстрации.

---

## Задание 5. ValueError на quantity

```python
import pytest


def test_add_zero_quantity_raises(cart):
    with pytest.raises(ValueError, match="quantity"):
        cart.add("X", Decimal("1"), 0)
```

**Что увидите:** покрыта ветка validation в [`cart.py`](examples/src/shop/cart.py).

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| `fixture 'cart' not found` | `conftest.py` в `tests/` |
| total != expected | tier2 в bulk_price — пересчитайте руками |
| items leak | нет `yield` + `clear()` |

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | `tests/test_cart.py` ≥5 tests green |
| 2 | yield fixture с teardown |
| 3 | filled_cart composition работает |
| 4 | Порядок tests не влияет |

## Уборка

Оставьте `test_cart.py` и обновлённый `conftest.py`.

## Вопросы для самопроверки

1. Где pytest ищет `conftest.py`?
2. Что если убрать `c.clear()` из yield?
3. Зачем `filled_cart` отдельно, а не inline add в test?

Далее: [06-parametrize-markers](06-parametrize-markers.md).
