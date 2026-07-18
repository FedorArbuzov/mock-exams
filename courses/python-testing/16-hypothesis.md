# 16. Property-based testing: Hypothesis

## Введение: «unit tests на 5 примеров — edge case на 47»

Review: «а что если percent=50 и price=0.01?» — ручной parametrize не масштабируется. **Hypothesis** генерирует сотни входов и **сжимает** контрпример до минимума.

## Что вы узнаете

- **`@given`** и **strategies** (`st.integers`, `st.decimals`).
- **Shrinking** — минимальный failing case.
- **Assumptions** `assume()` — отфильтровать invalid.
- Связь с [`pricing.py`](examples/src/shop/pricing.py).

---

## Установка

Уже в [`examples/pyproject.toml`](examples/pyproject.toml) dev deps.

```bash
pip install -e ".[dev]"
```

---

## Первый property test

```python
from decimal import Decimal
from hypothesis import given, strategies as st
from shop.pricing import apply_discount


@given(
    price=st.decimals(min_value=0, max_value=10_000, places=2),
    percent=st.integers(min_value=0, max_value=100),
)
def test_discount_never_exceeds_original(price, percent):
    result = apply_discount(price, percent)
    assert result <= price
    assert result >= 0
```

Hypothesis запускает **много** examples за один test.

---

## Strategies

| Strategy | Генерирует |
|----------|------------|
| `st.integers(min, max)` | int |
| `st.decimals(..., places=2)` | Decimal |
| `st.text()` | unicode str |
| `st.lists(st.integers())` | list |
| `st.fixed_dictionaries({...})` | dict shape |

---

## assume — valid inputs only

```python
from hypothesis import assume, given, strategies as st


@given(st.integers(), st.integers())
def test_bulk_positive(a, b):
    assume(a > 0 and b > 0)
    ...
```

Не генерируйте invalid — для invalid отдельный **unit** test с `pytest.raises`.

---

## shrinking demo

```python
# НAMERно сломанный property:
@given(st.integers(min_value=0, max_value=100))
def test_wrong(p):
    assert p < 10  # fails
```

Запуск покажет **minimal** counterexample — часто `p=10`.

---

## settings

```python
from hypothesis import settings, given, strategies as st

@settings(max_examples=500, deadline=1000)
@given(st.integers())
def test_heavy(n):
    ...
```

`deadline` — ms per example; полезно для slow tests.

---

## vs parametrize

| parametrize | Hypothesis |
|-------------|------------|
| вы **задаёте** cases | генерирует + shrink |
| deterministic | seed reproducible (`@seed`) |
| business examples | invariant properties |

Используйте **оба**: parametrize для known bugs, Hypothesis для invariants.

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| float strategy для денег | rounding | st.decimals |
| Слишком широкий domain | много reject assume | narrow strategy |
| Property = restate implementation | tautology | test invariant |
| max_examples=10000 в CI | slow | default 100 |

## На собеседовании

- Что такое **shrinking**?
- Пример **property** для pricing?

## Резюме

Hypothesis — invariants на множестве inputs. decimals + integers для shop. assume фильтрует; shrinking находит минимальный fail. Дополняет parametrize.

Далее: [17-lab-hypothesis](17-lab-hypothesis.md).
