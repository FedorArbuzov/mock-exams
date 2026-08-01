# 02. pytest: discovery, assert, CLI, configuration

## Intro: "the tests are there, pytest doesn't see them"

A new developer put the checks in `checks.py` — pytest **collected nothing**. Another runs `python test_foo.py` — bypassing fixtures and plugins. A third uses `assert 0.1 + 0.2 == 0.3` for money — flaky because of float.

This chapter is the **mechanics of pytest**: discovery, assert introspection, CLI, config in [`pyproject.toml`](examples/pyproject.toml).

## What you'll learn

- The **discovery** naming rules.
- **Assert introspection** and `pytest.raises`.
- CLI flags for daily work and CI.
- **Exit code** and its link to a GitLab job.

---

## Discovery

pytest collects tests by convention:

| Pattern | Example |
|---------|--------|
| file `test_*.py` | `tests/test_pricing.py` |
| file `*_test.py` | `tests/pricing_test.py` |
| function `test_*` | `def test_discount():` |
| class `Test*` (without `__init__`) | `class TestCart:` |
| method `test_*` in a class | `def test_empty(self):` |

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
pytest --collect-only
pytest -v
pytest tests/test_pricing_starter.py -v
pytest -k "discount" -v
```

`-k` — a filter by **substring** of the test/node name.

---

## Assert and introspection

```python
from decimal import Decimal
from shop.pricing import bulk_price, apply_discount

def test_bulk_five_items():
    assert bulk_price(Decimal("10.00"), 5) == Decimal("50.00")

def test_with_message():
    result = apply_discount(Decimal("100"), 10)
    assert result == Decimal("90.00"), f"expected 90.00, got {result}"
```

On failure pytest shows a **left / right** diff — no `self.assertEqual` needed.

**Important:** for money use `Decimal`, not `float`.

---

## Exceptions: pytest.raises

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

| Parameter | Why |
|----------|-------|
| `match="regex"` | check the error text |
| no match | any ValueError |

Don't catch a bare `Exception` — only the concrete type.

---

## CLI: locally and in CI

| Flag | Purpose |
|------|------------|
| `-v` / `-vv` | verbose, more detail |
| `-x` | stop on first failure |
| `--lf` | last failed only |
| `--ff` | failed first, then the rest |
| `--tb=short` / `line` / `no` | traceback format |
| `-q` | quiet (short CI log) |
| `--maxfail=N` | stop after N failures |
| `-m "not integration"` | by marker |

**Exit code:** `0` = all passed; `1` = there were failures; `2` = interrupted; `5` = no tests collected. A GitLab job must fail on non-zero.

---

## Configuration in pyproject.toml

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

| Option | Meaning |
|-------|-------|
| `testpaths` | where to look (not the whole repo) |
| `addopts -ra` | summary of skipped/failed at the end |
| `strict-markers` | error on an unknown `@pytest.mark.foo` |

Coverage — [14-coverage](14-coverage.md).

---

## First run

```bash
pytest -v
# tests/test_pricing_starter.py::test_apply_discount_no_change PASSED
```

| Symptom | Solution |
|---------|---------|
| `ModuleNotFoundError: shop` | `pip install -e ".[dev]"` |
| collected 0 items | file isn't `test_*.py` or function isn't `test_*` |
| wrong Python | activate `.venv` |

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| `float` for money | `0.1+0.2` | `Decimal` |
| Test without an assert | always passes | at least one assert |
| `if result: assert` | silent skip | assert without a condition |
| Importing the app at collect time | side effects | lazy import in a fixture |

## Interview questions

- How does pytest **find** tests?
- Why is `pytest.raises` better than try/except in a test?
- Why `strict-markers`?

## Summary

pytest discovery — `test_*.py` + `test_*`. Assert with a diff; `pytest.raises` for exceptions. Exit code 0 is the contract with CI. Config in pyproject.

Next: [03-lab-first-tests](03-lab-first-tests.md).
