# 06. parametrize and markers: DRY and filtering

## Intro: "copy-paste of 20 identical test functions"

Review: "why 20 functions `test_discount_5_percent`, `test_discount_10_percent`…?" — a single `@pytest.mark.parametrize` replaces them all. Markers are a way to **not run** integration on every commit.

## What you'll learn

- **`@pytest.mark.parametrize`** — ids, indirect.
- **Custom markers** and the `-m` filter.
- **`xfail`**, **`skip`** — known bugs and conditions.
- **`strict-markers`** in pyproject.

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

| ids= | Why |
|------|-------|
| list[str] | readable names in `-v` output |
| auto | pytest generates them |

---

## Multiple parameters

```python
@pytest.mark.parametrize("qty", [1, 5, 9])
@pytest.mark.parametrize("unit", [Decimal("10"), Decimal("25")])
def test_bulk_matrix(qty, unit):
    from shop.pricing import bulk_price
    result = bulk_price(unit, qty)
    assert result > 0
```

Order: **decorators from bottom to top** — a Cartesian product of all combinations.

---

## indirect parametrize

Passes the param into a **fixture**:

```python
@pytest.fixture
def discount_percent(request):
    return request.param


@pytest.mark.parametrize("discount_percent", [0, 10, 20], indirect=True)
def test_with_indirect(discount_percent):
    assert 0 <= discount_percent <= 100
```

Useful when the setup for each case is **expensive** and shared.

---

## Custom markers

In [`pyproject.toml`](examples/pyproject.toml):

```toml
markers = [
    "integration: needs docker or external service",
    "slow: long-running tests",
]
```

On a test:

```python
@pytest.mark.integration
def test_live_gateway():
    ...
```

Running:

```bash
pytest -m "not integration" -v      # fast MR job
pytest -m integration -v            # nightly
pytest --strict-markers               # error on a marker typo
```

---

## skip and xfail

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
| Expectation | test not run | run, failure ok |
| CI | skipped | XFAIL or XPASS |

---

## Link to CI

```yaml
# MR pipeline — fast
script:
  - pytest -m "not integration and not slow" --cov=shop

# nightly — full
script:
  - pytest -m "integration or slow"
```

See [26-ci-gitlab](26-ci-gitlab.md).

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| 100 cases in one parametrize | unreadable fail | ids, split files |
| `@pytest.mark.integration` without registration | warning / error | pyproject markers |
| xfail forever | the bug never gets fixed | ticket + deadline |
| skip without reason | unclear in CI | `reason=` is mandatory |

## Interview questions

- How to run **only** integration tests?
- How does **xfail** differ from **skip**?
- Why `ids` in parametrize?

## Summary

parametrize removes copy-paste; markers filter slow/integration. `strict-markers` catches typos. CI: a fast job without integration on MR.

Next: [07-mocking-patch](07-mocking-patch.md).
