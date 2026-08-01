# 19. Lab: a sqlite repository for Cart

## Lab goal

Implement `SqliteCartRepository`, integration tests with the `db_conn` fixture, and connect it to the domain `Cart`.

## Prerequisites

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
```

Theory: [18-integration-db](18-integration-db.md).

---

## Task 1. tests/integration/test_cart_sqlite.py

Copy `SqliteCartRepository` from [18-integration-db](18-integration-db.md) into `src/shop/repo.py` or `tests/integration/support/repo.py`.

Add the `db_conn` fixture to `tests/integration/conftest.py`.

---

## Task 2. save from Cart

```python
from decimal import Decimal
from shop.cart import Cart


@pytest.mark.integration
def test_persist_cart_lines(db_conn):
    from tests.integration.support.repo import SqliteCartRepository  # adjust import

    cart = Cart()
    cart.add("SKU-1", Decimal("15.00"), 2)
    cart.add("SKU-2", Decimal("5.00"), 1)

    repo = SqliteCartRepository(db_conn)
    lines = [(i.sku, i.unit_price, i.quantity) for i in cart.items]
    repo.save_lines(lines)

    assert repo.count_lines() == 2
```

---

## Task 3. empty cart

```python
@pytest.mark.integration
def test_empty_cart_zero_lines(db_conn):
    repo = SqliteCartRepository(db_conn)
    repo.save_lines([])
    assert repo.count_lines() == 0
```

---

## Task 4. marker + RUN_INTEGRATION

The sqlite integration **doesn't** require docker — but use the marker for consistency:

```bash
pytest tests/integration/test_cart_sqlite.py -v
```

Optional: gate only live HTTP tests with RUN_INTEGRATION; sqlite runs always.

---

## Task 5. coverage

```bash
pytest tests/integration/test_cart_sqlite.py --cov=shop --cov-report=term-missing
```

**What you'll see:** the repo module is covered.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| no such table | create the schema in the fixture |
| UNIQUE constraint | clear between tests |
| import path | editable install + package layout |

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | repo save + count tests green |
| 2 | db_conn rollback isolates |
| 3 | Cart domain + repo integration |
| 4 | ≥3 tests |

## Cleanup

Save the repo module for the capstone.

## Self-check questions

1. Why TEXT for Decimal?
2. Where is the unit vs integration boundary?

Next: [20-http-testing](20-http-testing.md).
