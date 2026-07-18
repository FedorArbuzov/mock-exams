# 15. Лаба: довести coverage shop до 85%

## Цель лабы

Запустить **term-missing**, закрыть gaps в `cart`, `users`, `pricing`, включить **fail_under** локально.

## Предварительно

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
pytest tests/unit -v
```

Теория: [14-coverage](14-coverage.md).

---

## Задание 1. Baseline report

```bash
pytest tests/unit --cov=shop --cov-report=term-missing
```

Запишите `%` по модулям в комментарий в `tests/COVERAGE.md` (создайте).

**Что увидите:** красные строки — обычно `ValueError` branches, `close()`, merge sku.

---

## Задание 2. Закрыть pricing

Убедитесь, что все ветки `apply_discount` и `bulk_price` покрыты (см. [03-lab-first-tests](03-lab-first-tests.md)).

```bash
pytest tests/unit/test_pricing.py --cov=shop.pricing --cov-report=term-missing
```

Target: **100%** на pricing.py.

---

## Задание 3. users.py context manager

Добавьте test owned-client path с patch:

```python
from unittest.mock import patch, MagicMock
from shop.users import UserService


def test_owned_client_closed():
    with patch("shop.users.httpx.Client") as MockCls:
        instance = MockCls.return_value
        with UserService("http://api.test") as svc:
            pass
        instance.close.assert_called()
```

**Что увидите:** `UserService.__exit__` и owned branch covered.

---

## Задание 4. cart edge cases

- duplicate sku merge
- `clear()` после yield fixture (косвенно covered)
- `total()` empty

---

## Задание 5. fail_under gate

```bash
pytest tests/unit --cov=shop --cov-fail-under=85
```

Если падает — добавьте tests, **не** понижайте порог без причины.

**Что увидите:** exit 0 при ≥85% total.

---

## Если не working

| Симптом | Действие |
|---------|----------|
| omit wrong package | `--cov=shop` matches src/shop |
| branch partial | add test for else branch |
| async_utils 0% | перейдите к [25-lab-async-tests](25-lab-async-tests.md) позже |

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | total coverage ≥85% |
| 2 | pricing.py 100% |
| 3 | COVERAGE.md с baseline/final |
| 4 | `--cov-fail-under=85` green |

## Уборка

Сохраните COVERAGE.md для capstone.

## Вопросы для самопроверки

1. Какая строка была последней непокрытой?
2. Зачем branch coverage для `if quantity >= tier2_at`?

Далее: [16-hypothesis](16-hypothesis.md).
