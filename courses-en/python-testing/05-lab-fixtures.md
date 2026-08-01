# 05. Lab: fixtures for Cart

## Lab goal

Move the Cart setup into a **yield fixture**, prove **isolation** between tests, add a **composed fixture** `filled_cart`.

## Prerequisites

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
pytest tests/test_pricing.py -v   # from the previous lab
```

Theory: [04-fixtures](04-fixtures.md).

---

## Task 1. cart fixture in conftest.py

Update [`tests/conftest.py`](examples/tests/conftest.py):

```python
import pytest
from shop.cart import Cart


@pytest.fixture
def cart() -> Cart:
    c = Cart()
    yield c
    c.clear()
```

Delete the old `empty_cart` if it duplicates this.

**What you'll see:** the fixture is available to all tests in `tests/` without an import.

---

## Task 2. tests/test_cart.py

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

**What you'll see:** 3 passed; test order doesn't matter.

---

## Task 3. filled_cart fixture

In `conftest.py`:

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
    # 100 + 2*50 = 200, without tier2 (< 10 items per sku logic)
    assert filled_cart.total() == Decimal("200.00")
```

**What you'll see:** `filled_cart` reuses the `cart` fixture chain.

---

## Task 4. Proving isolation

Add a "bad" test (temporarily):

```python
def test_mutate_for_demo(cart):
    cart.add("LEAK", Decimal("1"), 1)
    assert cart.total() == Decimal("1.00")
```

Run `pytest tests/test_cart.py -v` **twice** in different order:

```bash
pytest tests/test_cart.py::test_new_cart_is_empty tests/test_cart.py::test_mutate_for_demo -v
pytest tests/test_cart.py::test_mutate_for_demo tests/test_cart.py::test_new_cart_is_empty -v
```

**What you'll see:** both orders green — the teardown `clear()` after each test.

Remove `test_mutate_for_demo` after the demonstration.

---

## Task 5. ValueError on quantity

```python
import pytest


def test_add_zero_quantity_raises(cart):
    with pytest.raises(ValueError, match="quantity"):
        cart.add("X", Decimal("1"), 0)
```

**What you'll see:** the validation branch in [`cart.py`](examples/src/shop/cart.py) is covered.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| `fixture 'cart' not found` | `conftest.py` in `tests/` |
| total != expected | tier2 in bulk_price — recompute by hand |
| items leak | no `yield` + `clear()` |

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | `tests/test_cart.py` ≥5 tests green |
| 2 | yield fixture with teardown |
| 3 | filled_cart composition works |
| 4 | Test order has no effect |

## Cleanup

Keep `test_cart.py` and the updated `conftest.py`.

## Self-check questions

1. Where does pytest look for `conftest.py`?
2. What if you remove `c.clear()` from the yield?
3. Why is `filled_cart` separate rather than an inline add in the test?

Next: [06-parametrize-markers](06-parametrize-markers.md).
