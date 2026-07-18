# 19. Лаба: sqlite repository для Cart

## Цель лабы

Реализовать `SqliteCartRepository`, integration tests с `db_conn` fixture, связать с domain `Cart`.

## Предварительно

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
```

Теория: [18-integration-db](18-integration-db.md).

---

## Задание 1. tests/integration/test_cart_sqlite.py

Скопируйте `SqliteCartRepository` из [18-integration-db](18-integration-db.md) в `src/shop/repo.py` или `tests/integration/support/repo.py`.

Добавьте fixture `db_conn` в `tests/integration/conftest.py`.

---

## Задание 2. save from Cart

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

## Задание 3. empty cart

```python
@pytest.mark.integration
def test_empty_cart_zero_lines(db_conn):
    repo = SqliteCartRepository(db_conn)
    repo.save_lines([])
    assert repo.count_lines() == 0
```

---

## Задание 4. marker + RUN_INTEGRATION

Integration sqlite **не** требует docker — но используйте marker для consistency:

```bash
pytest tests/integration/test_cart_sqlite.py -v
```

Optional: gate only live HTTP tests with RUN_INTEGRATION; sqlite runs always.

---

## Задание 5. coverage

```bash
pytest tests/integration/test_cart_sqlite.py --cov=shop --cov-report=term-missing
```

**Что увидите:** repo module covered.

---

## Если не working

| Симптом | Действие |
|---------|----------|
| no such table | create schema in fixture |
| UNIQUE constraint | clear between tests |
| import path | editable install + package layout |

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | repo save + count tests green |
| 2 | db_conn rollback isolates |
| 3 | Cart domain + repo integration |
| 4 | ≥3 tests |

## Уборка

Сохраните repo module для capstone.

## Вопросы для самопроверки

1. Почему TEXT для Decimal?
2. Где boundary unit vs integration?

Далее: [20-http-testing](20-http-testing.md).
