# 15. Lab: bring shop coverage up to 85%

## Lab goal

Run **term-missing**, close gaps in `cart`, `users`, `pricing`, enable **fail_under** locally.

## Prerequisites

```bash
cd courses/python-testing/examples
pip install -e ".[dev]"
pytest tests/unit -v
```

Theory: [14-coverage](14-coverage.md).

---

## Task 1. Baseline report

```bash
pytest tests/unit --cov=shop --cov-report=term-missing
```

Record the per-module `%` in a comment in `tests/COVERAGE.md` (create it).

**What you'll see:** red lines — usually `ValueError` branches, `close()`, merge sku.

---

## Task 2. Close pricing

Make sure all branches of `apply_discount` and `bulk_price` are covered (see [03-lab-first-tests](03-lab-first-tests.md)).

```bash
pytest tests/unit/test_pricing.py --cov=shop.pricing --cov-report=term-missing
```

Target: **100%** on pricing.py.

---

## Task 3. users.py context manager

Add a test for the owned-client path with patch:

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

**What you'll see:** `UserService.__exit__` and the owned branch covered.

---

## Task 4. cart edge cases

- duplicate sku merge
- `clear()` after the yield fixture (indirectly covered)
- `total()` empty

---

## Task 5. fail_under gate

```bash
pytest tests/unit --cov=shop --cov-fail-under=85
```

If it fails — add tests, **don't** lower the threshold without a reason.

**What you'll see:** exit 0 at ≥85% total.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| omit wrong package | `--cov=shop` matches src/shop |
| branch partial | add a test for the else branch |
| async_utils 0% | move to [25-lab-async-tests](25-lab-async-tests.md) later |

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | total coverage ≥85% |
| 2 | pricing.py 100% |
| 3 | COVERAGE.md with baseline/final |
| 4 | `--cov-fail-under=85` green |

## Cleanup

Save COVERAGE.md for the capstone.

## Self-check questions

1. Which line was the last uncovered one?
2. Why branch coverage for `if quantity >= tier2_at`?

Next: [16-hypothesis](16-hypothesis.md).
