# 12. conftest.py, project layout, test discovery hierarchy

## Intro: "fixtures copied into 8 files"

DRY is broken: each test file declares its own `cart`. **`conftest.py`** — shared fixtures by directory hierarchy. The `tests/unit` vs `tests/integration` layout is a standard in mature projects.

## What you'll learn

- Where pytest looks for **conftest.py**.
- The **layout** src-layout + tests mirror.
- **Root conftest** vs **integration/conftest**.
- **`pytest_plugins`** for reuse across packages.

---

## The conftest hierarchy

```text
examples/
  src/shop/
  tests/
    conftest.py          # cart, filled_cart — all tests
    unit/
      conftest.py        # optional: unit-only fixtures
      test_pricing.py
    integration/
      conftest.py        # live_base_url, docker skip
      test_gateway.py
```

pytest **walks up** from the test file and **merges** fixtures from every conftest on the path.

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

No `import conftest` needed — pytest loads it automatically.

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

Auto-skip integration without env — a fast default `pytest`.

---

## src layout

```text
examples/
  pyproject.toml      # package-dir or setuptools packages
  src/shop/
  tests/
```

`pip install -e ".[dev]"` — `import shop` works in tests. **Don't** put tests inside `src/shop/`.

---

## pytest.ini vs pyproject

A single source of truth — [`pyproject.toml`](examples/pyproject.toml). No need to duplicate in `pytest.ini`.

---

## __init__.py in tests?

| Option | Recommendation |
|---------|--------------|
| tests without __init__ | **ok** (default) |
| tests/__init__.py | sometimes breaks import |
| tests/fakes/__init__.py | ok for a fakes package |

---

## capstone preview

[28-capstone](28-capstone.md) requires:

```text
tests/unit/
tests/integration/
```

Start the reorganization in [13-lab-conftest](13-lab-conftest.md).

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| conftest not on the path | fixture not found | put it above the test file |
| circular import in conftest | collect error | lazy imports |
| integration without a skip guard | CI fails without docker | RUN_INTEGRATION gate |

## Interview questions

- How does pytest **find** conftest?
- Why separate unit/integration directories?

## Summary

conftest — shared fixtures across the directory tree. Layout: src + tests/unit + tests/integration. Gate integration via env + a skip hook.

Next: [13-lab-conftest](13-lab-conftest.md).
