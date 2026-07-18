# Part 2 of expand-python-testing — lessons 02-28 + cheatsheet
def register(LESSONS, theory, lab):
    LESSONS["02-pytest-basics.md"] = theory(
        "02. pytest: discovery, assert, CLI, конфигурация",
        """Новый разработчик положил тесты в `checks.py` — pytest их **не нашёл**. Другой запускает `python test_foo.py` — минуя fixtures и plugins из `pyproject.toml`. Третий удивляется, что `assert 1 == 2` даёт **читаемый diff**, а `self.assertEqual` — нет.

Эта глава — **механика pytest**: discovery, assert introspection, CLI для daily work и CI, конфигурация проекта shop-lab.""",
        [
            "Правила **discovery** имён файлов, функций, классов.",
            "**Assert introspection** и `pytest.raises` с `match=`.",
            "CLI флаги: `-v`, `-x`, `--lf`, `-k`, markers.",
            "Конфигурацию [`examples/pyproject.toml`](examples/pyproject.toml) и exit code для CI.",
        ],
        [
            ("Discovery", """pytest **собирает** тесты автоматически:

| Паттерн | Пример |
|---------|--------|
| файл `test_*.py` | `tests/test_pricing.py` |
| файл `*_test.py` | `pricing_test.py` |
| функция `test_*` | `def test_discount():` |
| класс `Test*` (без `__init__`) | `class TestCart:` |

```bash
cd courses/python-testing/examples
python -m venv .venv
# Windows: .venv\\Scripts\\activate
pip install -e ".[dev]"
pytest --collect-only
pytest -v
pytest tests/test_pricing_starter.py -v
pytest -k "discount" -v
```

**Не найдено?** Проверьте `testpaths` в pyproject и что файл не в `.gitignore`."""),
            ("Assert introspection", """```python
from decimal import Decimal
from shop.pricing import bulk_price, apply_discount

def test_bulk_five_items():
    assert bulk_price(Decimal("10.00"), 5) == Decimal("50.00")

def test_bulk_with_message():
    result = bulk_price(Decimal("10.00"), 10)
    assert result == Decimal("95.00"), f"expected tier2 discount, got {result}"
```

При падении pytest показывает **left / right** — не нужен `self.assertEqual`. Для коллекций — diff элементов."""),
            ("Исключения: pytest.raises", """```python
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

`match=` — regex на текст ошибки. **Не** ловите голый `Exception` без причины — скрываете баги."""),
            ("CLI для CI и локальной работы", """| Флаг | Назначение |
|------|------------|
| `-v` / `-vv` | verbose, больше деталей |
| `-x` | stop on first failure |
| `--lf` | last failed only |
| `--tb=short` / `--tb=no` | traceback в CI logs |
| `-q` | quiet summary |
| `--maxfail=3` | останов после N падений |
| `-m "not integration"` | фильтр по marker |
| `--strict-markers` | ошибка на неизвестный marker |

**Exit code:** `0` = все прошли — контракт для GitLab `script:` ([урок 26](26-ci-gitlab.md))."""),
            ("Конфигурация pyproject.toml", """```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = "-ra --strict-markers"
markers = [
    "integration: needs docker or external service",
    "slow: long-running tests",
]
```

`-ra` — summary **skipped / xfailed / failed** в конце. `asyncio_mode = "auto"` — для [`async_utils`](examples/src/shop/async_utils.py) в уроке 24."""),
            ("Первый прогон shop-lab", """```bash
pytest -v
# tests/test_pricing_starter.py::test_apply_discount_no_change PASSED
```

Starter-тест уже в репозитории — в [03-lab-first-tests](03-lab-first-tests.md) расширите suite.

| Проблема | Решение |
|----------|---------|
| `ModuleNotFoundError: shop` | `pip install -e ".[dev]"` |
| 0 tests collected | имя файла не `test_*.py` |
| warnings as errors | `-W default` или fix warning |"""),
            ("Сравнение с unittest", """unittest остаётся в stdlib и в legacy. pytest **запускает** unittest TestCase. Новый код в mock-exams — pytest.

Миграция: заменить `self.assertEqual` → `assert`, setUp → fixture. См. [`fastapi/30-testing`](../fastapi/30-testing.md) — там TestClient + pytest."""),
        ],
        "pytest находит `test_*`, падает с полезным diff, настраивается через pyproject. Exit code 0 — контракт с CI; следующий шаг — написать pricing tests руками.",
        "03-lab-first-tests.md",
    )

    LESSONS["03-lab-first-tests.md"] = lab(
        "03. Лаба: первые unit-тесты pricing",
        "Написать **parametrize**-набор для `apply_discount` и `bulk_price` в [`shop/pricing.py`](examples/src/shop/pricing.py) — фундамент test suite shop-lab.",
        """```bash
cd courses/python-testing/examples
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -e ".[dev]"
pytest -v
```""",
        "[02-pytest-basics](02-pytest-basics.md)",
        [
            ("Файл tests/test_pricing.py", """Создайте `tests/test_pricing.py`:

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
```""",
             "`4 passed` — по одному прогону на каждую строку parametrize."),
            ("ValueError на границах", """Добавьте тесты на invalid input:

```python
@pytest.mark.parametrize("percent", [-1, 101])
def test_apply_discount_bad_percent(percent):
    with pytest.raises(ValueError, match="percent"):
        apply_discount(Decimal("10"), percent)


def test_apply_discount_negative_price():
    with pytest.raises(ValueError, match="price"):
        apply_discount(Decimal("-0.01"), 0)
```""",
             "3+ passed; текст ошибки совпадает с `match=`."),
            ("bulk_price: tier и quantity", """```python
def test_bulk_no_discount_below_tier():
    assert bulk_price(Decimal("10.00"), 5) == Decimal("50.00")


def test_bulk_tier_discount_at_10():
    # 10 × 10 = 100, minus 5% = 95.00
    assert bulk_price(Decimal("10.00"), 10) == Decimal("95.00")


def test_bulk_zero_quantity():
    with pytest.raises(ValueError, match="quantity"):
        bulk_price(Decimal("10"), 0)
```""",
             "tier2 срабатывает при `quantity >= 10` (default `tier2_at`)."),
            ("Запуск подмножества и coverage preview", """```bash
pytest tests/test_pricing.py -v
pytest -k bulk -v
pytest --cov=shop.pricing --cov-report=term-missing tests/test_pricing.py
```""",
             "Coverage report — prelude к [14-coverage](14-coverage.md); pricing.py должен быть ~100% line."),
            ("Рефлексия: один assert — одна идея", """Перечитайте тесты. Если один test проверяет и discount, и bulk — **разделите**.

```python
# плохо: два unrelated assert в одном test
# хорошо: parametrize или отдельные def test_*
```""",
             "Suite читается как спецификация pricing rules."),
        ],
        "04-fixtures.md",
    )

    LESSONS["04-fixtures.md"] = theory(
        "04. Fixtures: scope, autouse, yield, composition",
        """Тест A добавил item в Cart. Тест B ожидал пустую корзину — **упал только в full suite**, локально проходил. Классика **shared mutable state**.

Fixtures pytest — способ дать каждому тесту **свежий** объект и **гарантированно убрать** за собой через yield. Cart в [`shop/cart.py`](examples/src/shop/cart.py) — главный пример stateful кода в курсе.""",
        [
            "Scope: function, module, class, session — когда какой.",
            "Yield-fixtures для teardown (clear, close).",
            "`autouse` — глобальный reset, осторожно.",
            "Composition: fixture может зависеть от fixture.",
        ],
        [
            ("Базовый fixture", """```python
import pytest
from shop.cart import Cart


@pytest.fixture
def cart() -> Cart:
    return Cart()


def test_empty_total(cart):
    assert cart.total() == 0


def test_add_increases_total(cart):
    from decimal import Decimal

    cart.add("SKU1", Decimal("10.00"), 2)
    assert cart.total() == Decimal("20.00")
```

Каждый test получает **новый** Cart (scope=function по умолчанию)."""),
            ("Scope", """| scope | Создание | Когда использовать |
|-------|----------|-------------------|
| function | каждый test | **default**, mutable state |
| class | каждый TestClass | группа tests в классе |
| module | один раз на файл | дорогой read-only setup |
| session | весь pytest run | docker, БД connection pool |

**Правило:** Cart, файлы, env — **function** или yield teardown."""),
            ("Yield fixture и teardown", """```python
@pytest.fixture
def cart() -> Cart:
    c = Cart()
    yield c
    c.clear()  # выполнится даже если test упал


@pytest.fixture
def user_service():
    from shop.users import UserService

    svc = UserService("http://fake.example")
    yield svc
    svc.close()
```

Аналог `try/finally` в одном месте — DRY для cleanup."""),
            ("autouse", """```python
@pytest.fixture(autouse=True)
def reset_shop_debug(monkeypatch):
    monkeypatch.delenv("SHOP_DEBUG", raising=False)
```

**autouse** — fixture без аргумента в test. Используйте для env reset; **не** прячьте бизнес-setup — test должен читаться явно."""),
            ("Fixture dependencies", """```python
@pytest.fixture
def filled_cart(cart):
    from decimal import Decimal

    cart.add("WIDGET", Decimal("5.00"), 3)
    return cart


def test_filled_has_items(filled_cart):
    assert len(filled_cart.items) == 1
    assert filled_cart.total() > 0
```

Граф fixtures — declarative setup tree."""),
            ("conftest.py preview", """Fixtures в `tests/conftest.py` видны **всем** tests в subtree. Иерархия — [12-conftest-layout](12-conftest-layout.md).

Starter: [`examples/tests/conftest.py`](examples/tests/conftest.py) уже содержит `empty_cart`."""),
            ("Связь с FastAPI", """FastAPI `TestClient` часто оборачивают в session/module fixture с app lifespan. См. [`fastapi/30-testing`](../fastapi/30-testing.md) — тот же pytest, другой объект под test."""),
        ],
        "Fixtures = setup + teardown с composability. Mutable state — function scope или yield clear; UserService — yield close.",
        "05-lab-fixtures.md",
    )

    LESSONS["05-lab-fixtures.md"] = lab(
        "05. Лаба: fixtures для Cart",
        "Покрыть [`shop/cart.py`](examples/src/shop/cart.py) unit-тестами с fixtures: add, merge sku, total с bulk tier, clear, ValueError.",
        """```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
pytest -v
```""",
        "[04-fixtures](04-fixtures.md)",
        [
            ("Fixture cart в conftest", """Обновите `tests/conftest.py`:

```python
import pytest


@pytest.fixture
def cart():
    from shop.cart import Cart

    c = Cart()
    yield c
    c.clear()
```""",
             "Teardown `clear()` — suite не зависит от порядка tests."),
            ("test_cart.py: add и merge", """Создайте `tests/test_cart.py`:

```python
from decimal import Decimal


def test_add_single_item(cart):
    cart.add("A", Decimal("10.00"), 1)
    assert cart.total() == Decimal("10.00")


def test_merge_same_sku(cart):
    cart.add("A", Decimal("10.00"), 2)
    cart.add("A", Decimal("10.00"), 3)
    assert len(cart.items) == 1
    assert cart.items[0].quantity == 5
```""",
             "`2 passed`; второй add не создаёт второй line item."),
            ("total с bulk tier", """```python
def test_total_with_bulk_discount(cart):
    cart.add("BULK", Decimal("10.00"), 10)
    assert cart.total() == Decimal("95.00")
```""",
             "Cart делегирует в `bulk_price` — tier2 5%."),
            ("ValueError и clear", """```python
import pytest


def test_add_invalid_quantity(cart):
    with pytest.raises(ValueError):
        cart.add("X", Decimal("1"), 0)


def test_clear_empties_cart(cart):
    from decimal import Decimal

    cart.add("X", Decimal("5"), 1)
    cart.clear()
    assert cart.total() == 0
    assert cart.items == []
```""",
             "4+ tests в файле, все green."),
            ("Полный прогон", """```bash
pytest tests/test_cart.py -v
pytest -v  # pricing + cart together
```""",
             "Нет flaky: запустите дважды — тот же результат."),
        ],
        "06-parametrize-markers.md",
    )

    LESSONS["06-parametrize-markers.md"] = theory(
        "06. parametrize и markers: DRY и фильтрация CI",
        """Copy-paste: десять функций `test_discount_5`, `test_discount_10`… Рефакторинг — правка в десяти местах. **`@pytest.mark.parametrize`** — одна функция, таблица входов.

Markers — второй инструмент: `@pytest.mark.integration` отделяет медленные тесты от MR pipeline ([`gitlab-basic`](../gitlab-basic/README.md)).""",
        [
            "`@pytest.mark.parametrize` — ids, indirect.",
            "Custom markers в pyproject и `--strict-markers`.",
            "`-m` expression для CI: `not integration`.",
            "Комбинация parametrize + fixtures.",
        ],
        [
            ("parametrize basics", """```python
import pytest
from decimal import Decimal
from shop.pricing import apply_discount


@pytest.mark.parametrize(
    "price,pct,expected",
    [
        (Decimal("100"), 0, Decimal("100.00")),
        (Decimal("100"), 10, Decimal("90.00")),
    ],
    ids=["no-discount", "ten-percent"],
)
def test_apply(price, pct, expected):
    assert apply_discount(price, pct) == expected
```

`ids=` — читаемые имена в `-v` output."""),
            ("Несколько parametrize", """Декораторы **умножаются** (cartesian product):

```python
@pytest.mark.parametrize("qty", [1, 10])
@pytest.mark.parametrize("unit", [Decimal("5"), Decimal("10")])
def test_bulk_grid(qty, unit):
    from shop.pricing import bulk_price
    result = bulk_price(unit, qty)
    assert result >= 0
```

Осторожно: explosion количества tests."""),
            ("Markers", """В `pyproject.toml`:

```toml
markers = [
    "integration: needs docker or external service",
    "slow: long-running tests",
]
```

```python
import pytest

@pytest.mark.integration
def test_live_gateway():
    ...
```

```bash
pytest -m "not integration"   # MR pipeline
pytest -m integration         # nightly
```"""),
            ("skip и xfail", """```python
import pytest

@pytest.mark.skip(reason="API not deployed")
def test_future():
    ...

@pytest.mark.xfail(reason="known bug SHOP-42")
def test_known_bug():
    assert False
```

`xfail` — ожидаемое падение; не злоупотребляйте вместо fix ([27-flaky-debugging](27-flaky-debugging.md))."""),
            ("indirect parametrize", """```python
@pytest.fixture
def price(request):
    return request.param

@pytest.mark.parametrize("price", [Decimal("1"), Decimal("99")], indirect=True)
def test_with_indirect(price):
    assert price > 0
```

Редко нужно; полезно когда setup зависит от param."""),
            ("CI split", """| Job | Команда |
|-----|---------|
| unit-fast | `pytest -m "not integration and not slow"` |
| integration | `pytest -m integration` |

См. [26-ci-gitlab](26-ci-gitlab.md)."""),
        ],
        "parametrize убирает copy-paste; markers делят suite на fast/slow/integration для разумного CI.",
        "07-mocking-patch.md",
    )

    LESSONS["07-mocking-patch.md"] = theory(
        "07. unittest.mock: patch, MagicMock, pytest-mock",
        """`UserService.get_user` бьёт в HTTP ([`shop/users.py`](examples/src/shop/users.py)). Unit-test не должен зависеть от сети, DNS и staging API. **Mock** подменяет границу I/O.

Классическая ошибка: патчить `httpx.get` там, где **определён**, а не там, где **используется** — mock не срабатывает, test ходит в сеть.""",
        [
            "`MagicMock` и цепочка `return_value`.",
            "`@patch` / `mocker.patch` — **where used**.",
            "Dependency injection: `UserService(..., client=mock)`.",
            "pytest-mock `mocker` fixture — auto undo.",
        ],
        [
            ("Injection без patch", """```python
from unittest.mock import MagicMock
from shop.users import UserService


def test_get_user_parsed():
    mock_client = MagicMock()
    mock_client.get.return_value.raise_for_status = MagicMock()
    mock_client.get.return_value.json.return_value = {
        "id": 1,
        "email": "a@b.c",
        "active": True,
    }
    svc = UserService("http://fake", client=mock_client)
    user = svc.get_user(1)
    assert user.email == "a@b.c"
    mock_client.get.assert_called_once_with("http://fake/users/1")
```

**Предпочтительно:** inject mock client — явно и без patch path magic."""),
            ("patch where used", """```python
from unittest.mock import patch

@patch("shop.users.httpx.Client")
def test_with_patch(MockClient):
    instance = MockClient.return_value
    instance.get.return_value.json.return_value = {"id": 1, "email": "x", "active": True}
    instance.get.return_value.raise_for_status = MagicMock()
    ...
```

Патч **`shop.users.httpx.Client`**, не `httpx.Client` globally."""),
            ("pytest-mock", """```python
def test_get_user(mocker):
    mock_get = mocker.patch.object(
        mocker.Mock(), "get"
    )  # или patch path
```

`mocker` автоматически **stopall** после test — меньше leak между tests.

```bash
pip install pytest-mock  # уже в dev deps
```"""),
            ("assert_called и side_effect", """```python
mock_client.get.assert_called_once()
mock_client.get.side_effect = httpx.HTTPStatusError(...)
```

Проверяйте **вызовы** только когда это контракт (retry, cache miss). Иначе — fragile tests."""),
            ("Mock vs fake", """| | Mock | Fake |
|---|------|------|
| Поведение | scripted returns | упрощённая реализация |
| Assert calls | да | редко |
| Пример | MagicMock | in-memory dict DB |

Подробнее — [10-fakes-stubs](10-fakes-stubs.md)."""),
            ("HTTP в FastAPI", """Mock `httpx` при тестировании **clients**; для API используйте TestClient ([`fastapi/30-testing`](../fastapi/30-testing.md))."""),
        ],
        "Mock границу I/O; inject client когда возможно; patch where used; pytest-mock для cleanup.",
        "08-lab-mocking.md",
    )

    LESSONS["08-lab-mocking.md"] = lab(
        "08. Лаба: mock HTTP для UserService",
        "Unit-тесты [`shop/users.py`](examples/src/shop/users.py) с injected mock client и pytest-mock — без live network.",
        """```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
```""",
        "[07-mocking-patch](07-mocking-patch.md)",
        [
            ("test_users.py: happy path", """```python
from unittest.mock import MagicMock

from shop.users import UserService


def test_get_user_success():
    mock_client = MagicMock()
    mock_client.get.return_value.raise_for_status = MagicMock()
    mock_client.get.return_value.json.return_value = {
        "id": 42,
        "email": "user@shop.test",
        "active": True,
    }
    svc = UserService("http://api.test", client=mock_client)
    user = svc.get_user(42)
    assert user.id == 42
    assert user.active is True
    mock_client.get.assert_called_once_with("http://api.test/users/42")
```""",
             "`1 passed`; URL собран с `base_url.rstrip('/')`."),
            ("HTTP error", """```python
import httpx
import pytest


def test_get_user_http_error():
    mock_client = MagicMock()
    mock_client.get.return_value.raise_for_status.side_effect = httpx.HTTPStatusError(
        "404", request=MagicMock(), response=MagicMock()
    )
    svc = UserService("http://api.test", client=mock_client)
    with pytest.raises(httpx.HTTPStatusError):
        svc.get_user(999)
```""",
             "Exception пробрасывается — не глотайте ошибки в service без требования."),
            ("context manager close", """```python
def test_user_service_closes_owned_client():
    with UserService("http://api.test") as svc:
        assert svc._owns_client is True
    # после exit owned client closed
```""",
             "Optional: mock httpx.Client constructor via mocker."),
            ("pytest-mock variant", """```python
def test_get_user_with_mocker(mocker):
    mock_client = mocker.MagicMock()
    mock_client.get.return_value.json.return_value = {
        "id": 1, "email": "a@b.c", "active": False,
    }
    mock_client.get.return_value.raise_for_status = mocker.MagicMock()
    svc = UserService("http://x", client=mock_client)
    assert svc.get_user(1).active is False
```""",
             "Эквивалент injection — выберите один стиль в проекте."),
            ("Прогон", """```bash
pytest tests/test_users.py -v
pytest -v
```""",
             "users.py покрыт без curl."),
        ],
        "09-monkeypatch-capsys.md",
    )

    # Continue in part3 for lessons 09-28
    try:
        from expand_python_testing_part3 import register_part3
        register_part3(LESSONS, theory, lab)
    except ImportError:
        import importlib.util
        from pathlib import Path
        p3 = Path(__file__).parent / "expand-python-testing-part3.py"
        if p3.exists():
            spec = importlib.util.spec_from_loader("p3", importlib.util.SourceFileLoader("p3", str(p3)))
            mod = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(mod)
            mod.register_part3(LESSONS, theory, lab)
