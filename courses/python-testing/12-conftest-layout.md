# 12. conftest.py, layout проекта, test discovery hierarchy

## Введение: «fixtures скопированы в 8 файлов»

DRY нарушен: каждый test file объявляет свой `cart`. **`conftest.py`** — shared fixtures по иерархии каталогов. Layout `tests/unit` vs `tests/integration` — стандарт в mature projects.

## Что вы узнаете

- Где pytest ищет **conftest.py**.
- **Layout** src-layout + tests mirror.
- **Root conftest** vs **integration/conftest**.
- **`pytest_plugins`** для переиспользования между packages.

---

## Иерархия conftest

```text
examples/
  src/shop/
  tests/
    conftest.py          # cart, filled_cart — все tests
    unit/
      conftest.py        # optional: unit-only fixtures
      test_pricing.py
    integration/
      conftest.py        # live_base_url, docker skip
      test_gateway.py
```

pytest **поднимается** от test file вверх и **мерджит** fixtures из всех conftest на пути.

---

## Root conftest

[`examples/tests/conftest.py`](examples/tests/conftest.py):

```python
import pytest
from shop.cart import Cart


@pytest.fixture
def cart() -> Cart:
    c = Cart()
    yield c
    c.clear()
```

Не нужно `import conftest` — pytest загружает автоматически.

---

## integration/conftest.py

```python
import os
import pytest

LIVE_BASE = os.getenv("LIVE_BASE_URL", "http://localhost:8095")


@pytest.fixture(scope="session")
def live_base_url():
    return LIVE_BASE


def pytest_collection_modifyitems(config, items):
    if not os.getenv("RUN_INTEGRATION"):
        skip = pytest.mark.skip(reason="set RUN_INTEGRATION=1")
        for item in items:
            if "integration" in item.keywords:
                item.add_marker(skip)
```

Auto-skip integration без env — быстрый default `pytest`.

---

## src layout

```text
examples/
  pyproject.toml      # package-dir or setuptools packages
  src/shop/
  tests/
```

`pip install -e ".[dev]"` — `import shop` работает в tests. **Не** кладите tests внутрь `src/shop/`.

---

## pytest.ini vs pyproject

Один источник правды — [`pyproject.toml`](examples/pyproject.toml). Дублировать в `pytest.ini` не нужно.

---

## __init__.py в tests?

| Вариант | Рекомендация |
|---------|--------------|
| tests без __init__ | **ok** (default) |
| tests/__init__.py | иногда ломает import |
| tests/fakes/__init__.py | ok для package fakes |

---

## capstone preview

[28-capstone](28-capstone.md) требует:

```text
tests/unit/
tests/integration/
```

Начните реорганизацию в [13-lab-conftest](13-lab-conftest.md).

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| conftest не на пути | fixture not found | положить выше test file |
| circular import в conftest | collect error | lazy imports |
| integration без skip guard | CI fail без docker | RUN_INTEGRATION gate |

## На собеседовании

- Как pytest **находит** conftest?
- Зачем разделять unit/integration каталоги?

## Резюме

conftest — shared fixtures по дереву каталогов. Layout: src + tests/unit + tests/integration. Gate integration через env + skip hook.

Далее: [13-lab-conftest](13-lab-conftest.md).
