# 02. pytest: discovery, assert, CLI, конфигурация

## Введение: «тесты есть, pytest их не видит»

Новый разработчик положил проверки в `checks.py` — pytest **ничего не собрал**. Другой запускает `python test_foo.py` — минуя fixtures и plugins. Третий использует `assert 0.1 + 0.2 == 0.3` для денег — flaky из-за float.

Эта глава — **механика pytest**: discovery, assert introspection, CLI, конфиг в [`pyproject.toml`](examples/pyproject.toml).

## Что вы узнаете

- Правила **discovery** имён.
- **Assert introspection** и `pytest.raises`.
- CLI-флаги для daily work и CI.
- **Exit code** и связь с GitLab job.

---

## Discovery

pytest собирает тесты по соглашениям:

| Паттерн | Пример |
|---------|--------|
| файл `test_*.py` | `tests/test_pricing.py` |
| файл `*_test.py` | `tests/pricing_test.py` |
| функция `test_*` | `def test_discount():` |
| класс `Test*` (без `__init__`) | `class TestCart:` |
| метод `test_*` в классе | `def test_empty(self):` |

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
pytest --collect-only
pytest -v
pytest tests/test_pricing_starter.py -v
pytest -k "discount" -v
```

`-k` — фильтр по **substring** имени test/node.

---

## Assert и introspection

```python
from decimal import Decimal
from shop.pricing import bulk_price, apply_discount

def test_bulk_five_items():
    assert bulk_price(Decimal("10.00"), 5) == Decimal("50.00")

def test_with_message():
    result = apply_discount(Decimal("100"), 10)
    assert result == Decimal("90.00"), f"expected 90.00, got {result}"
```

При падении pytest показывает **left / right** diff — не нужен `self.assertEqual`.

**Важно:** для денег используйте `Decimal`, не `float`.

---

## Исключения: pytest.raises

```python
import pytest
from decimal import Decimal
from shop.pricing import apply_discount

def test_percent_out_of_range():
    with pytest.raises(ValueError, match="percent"):
        apply_discount(Decimal("10"), 101)

def test_negative_price():
    with pytest.raises(ValueError, match="price"):
        apply_discount(Decimal("-1"), 0)
```

| Параметр | Зачем |
|----------|-------|
| `match="regex"` | проверить текст ошибки |
| без match | любой ValueError |

Не ловите голый `Exception` — только конкретный тип.

---

## CLI: локально и в CI

| Флаг | Назначение |
|------|------------|
| `-v` / `-vv` | verbose, больше деталей |
| `-x` | stop on first failure |
| `--lf` | last failed only |
| `--ff` | failed first, потом остальные |
| `--tb=short` / `line` / `no` | формат traceback |
| `-q` | quiet (короткий лог CI) |
| `--maxfail=N` | стоп после N падений |
| `-m "not integration"` | по marker |

**Exit code:** `0` = все прошли; `1` = были failures; `2` = interrupted; `5` = no tests collected. GitLab job должен падать при non-zero.

---

## Конфигурация pyproject.toml

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = "-ra --strict-markers"
markers = [
    "integration: needs docker or external service",
    "slow: long-running tests",
]
```

| Опция | Смысл |
|-------|-------|
| `testpaths` | где искать (не весь repo) |
| `addopts -ra` | summary skipped/failed в конце |
| `strict-markers` | ошибка на неизвестный `@pytest.mark.foo` |

Coverage — [14-coverage](14-coverage.md).

---

## Первый прогон

```bash
pytest -v
# tests/test_pricing_starter.py::test_apply_discount_no_change PASSED
```

| Симптом | Решение |
|---------|---------|
| `ModuleNotFoundError: shop` | `pip install -e ".[dev]"` |
| collected 0 items | файл не `test_*.py` или функция не `test_*` |
| wrong Python | активируйте `.venv` |

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| `float` для денег | `0.1+0.2` | `Decimal` |
| Тест без assert | always pass | хотя бы один assert |
| `if result: assert` | silent skip | assert без условия |
| Импорт app при collect | side effects | lazy import в fixture |

## На собеседовании

- Как pytest **находит** тесты?
- Чем `pytest.raises` лучше try/except в test?
- Зачем `strict-markers`?

## Резюме

pytest discovery — `test_*.py` + `test_*`. Assert с diff; `pytest.raises` для исключений. Exit code 0 — контракт с CI. Конфиг в pyproject.

Далее: [03-lab-first-tests](03-lab-first-tests.md).
