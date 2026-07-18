# 06. parametrize и markers: DRY и фильтрация

## Введение: «копипаста из 20 одинаковых test functions»

Review: «почему 20 функций `test_discount_5_percent`, `test_discount_10_percent`…?» — один `@pytest.mark.parametrize` заменяет всё. Markers — способ **не гонять** integration на каждый commit.

## Что вы узнаете

- **`@pytest.mark.parametrize`** — ids, indirect.
- **Custom markers** и `-m` фильтр.
- **`xfail`**, **`skip`** — известные баги и условия.
- **`strict-markers`** в pyproject.

---

## parametrize

```python
import pytest
from decimal import Decimal
from shop.pricing import apply_discount


@pytest.mark.parametrize(
    "price,percent,expected",
    [
        (Decimal("100"), 0, Decimal("100.00")),
        (Decimal("100"), 10, Decimal("90.00")),
        (Decimal("50"), 50, Decimal("25.00")),
    ],
    ids=["no-discount", "ten-percent", "half-price"],
)
def test_apply_discount(price, percent, expected):
    assert apply_discount(price, percent) == expected
```

| ids= | Зачем |
|------|-------|
| list[str] | читаемые имена в `-v` output |
| auto | pytest генерирует |

---

## Несколько параметров

```python
@pytest.mark.parametrize("qty", [1, 5, 9])
@pytest.mark.parametrize("unit", [Decimal("10"), Decimal("25")])
def test_bulk_matrix(qty, unit):
    from shop.pricing import bulk_price
    result = bulk_price(unit, qty)
    assert result > 0
```

Порядок: **декораторы снизу вверх** — Cartesian product всех комбинаций.

---

## indirect parametrize

Передаёт param в **fixture**:

```python
@pytest.fixture
def discount_percent(request):
    return request.param


@pytest.mark.parametrize("discount_percent", [0, 10, 20], indirect=True)
def test_with_indirect(discount_percent):
    assert 0 <= discount_percent <= 100
```

Полезно когда setup для каждого case **дорогой** и общий.

---

## Custom markers

В [`pyproject.toml`](examples/pyproject.toml):

```toml
markers = [
    "integration: needs docker or external service",
    "slow: long-running tests",
]
```

На test:

```python
@pytest.mark.integration
def test_live_gateway():
    ...
```

Запуск:

```bash
pytest -m "not integration" -v      # быстрый MR job
pytest -m integration -v            # nightly
pytest --strict-markers               # ошибка на typo mark
```

---

## skip и xfail

```python
import sys
import pytest


@pytest.mark.skipif(sys.version_info < (3, 12), reason="needs 3.12+")
def test_match_case():
    ...


@pytest.mark.xfail(reason="bug SHOP-42: tier rounding")
def test_known_bug():
    assert False
```

| | skip | xfail |
|---|------|-------|
| Ожидание | test не run | run, failure ok |
| CI | skipped | XFAIL или XPASS |

---

## Связь с CI

```yaml
# MR pipeline — быстро
script:
  - pytest -m "not integration and not slow" --cov=shop

# nightly — полный
script:
  - pytest -m "integration or slow"
```

См. [26-ci-gitlab](26-ci-gitlab.md).

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| 100 cases в одном parametrize | нечитаемый fail | ids, split files |
| `@pytest.mark.integration` без регистрации | warning / error | pyproject markers |
| xfail forever | баг не чинят | ticket + deadline |
| skip без reason | непонятно в CI | `reason=` обязателен |

## На собеседовании

- Как запустить **только** integration tests?
- Чем **xfail** от **skip**?
- Зачем `ids` в parametrize?

## Резюме

parametrize убирает копипасту; markers фильтруют slow/integration. `strict-markers` ловит опечатки. CI: быстрый job без integration на MR.

Далее: [07-mocking-patch](07-mocking-patch.md).
