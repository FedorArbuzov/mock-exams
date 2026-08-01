# 13. Lab: reorganizing tests/ and the integration gate

## Lab goal

Split tests into **unit/** and **integration/**; add **auto-skip** for integration without `RUN_INTEGRATION=1`.

## Prerequisites

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
pytest -v
```

Theory: [12-conftest-layout](12-conftest-layout.md).

---

## Task 1. Moving unit tests

```bash
mkdir -p tests/unit
mv tests/test_pricing.py tests/unit/
mv tests/test_cart.py tests/unit/
mv tests/test_users.py tests/unit/
mv tests/test_users_fake.py tests/unit/
# test_pricing_starter.py also into unit/
mv tests/test_pricing_starter.py tests/unit/
```

`conftest.py` **stays** in `tests/`.

**What you'll see:** `pytest -v` still finds the tests — `testpaths = ["tests"]`.

---

## Task 2. integration/conftest.py

```python
# tests/integration/conftest.py
import os
import pytest

LIVE_BASE = os.getenv("LIVE_BASE_URL", "http://localhost:8095")


@pytest.fixture(scope="session")
def live_base_url() -> str:
    return LIVE_BASE
```

---

## Task 3. pytest_collection_modifyitems

In `tests/conftest.py` add:

```python
import os
import pytest


def pytest_collection_modifyitems(config, items):
    if os.getenv("RUN_INTEGRATION"):
        return
    skip = pytest.mark.skip(reason="integration: set RUN_INTEGRATION=1")
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(skip)
```

---

## Task 4. The first integration test

`tests/integration/test_gateway_health.py`:

```python
import httpx
import pytest


@pytest.mark.integration
def test_gateway_health(live_base_url):
    r = httpx.get(f"{live_base_url}/health", timeout=5.0)
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
```

Without docker:

```bash
pytest -v
# integration SKIPPED
```

With docker ([`deploy/python-async`](../../deploy/python-async/README.md)):

```bash
# terminal 1
cd deploy/python-async && docker compose up -d

# terminal 2
cd courses/python-testing/examples
set RUN_INTEGRATION=1          # Windows
# export RUN_INTEGRATION=1     # Linux
pytest tests/integration -v
```

**What you'll see:** 1 passed against :8095.

---

## Task 5. A fast MR job locally

```bash
pytest -m "not integration" -v
```

**What you'll see:** unit only, without skip messages for integration (they're not collected if the path is unit-only — or skipped if collected).

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| import tests.fakes broken | fix the path or PYTHONPATH |
| connection refused :8095 | docker compose up |
| integration not skipped | check the hook in the root conftest |

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | tests/unit/ contains pricing, cart, users |
| 2 | integration skipped without RUN_INTEGRATION |
| 3 | live health test passes with docker |
| 4 | `pytest -m "not integration"` is fast |

## Cleanup

The structure stays until the capstone.

## Self-check questions

1. Why a hook and not just `-m`?
2. session scope for live_base_url — ok?

Next: [14-coverage](14-coverage.md).
