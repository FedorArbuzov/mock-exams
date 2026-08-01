# 16. Property-based testing: Hypothesis

## Intro: "unit tests on 5 examples — the edge case is at 47"

Review: "what if percent=50 and price=0.01?" — manual parametrize doesn't scale. **Hypothesis** generates hundreds of inputs and **shrinks** the counterexample down to a minimum.

## What you'll learn

- **`@given`** and **strategies** (`st.integers`, `st.decimals`).
- **Shrinking** — the minimal failing case.
- **Assumptions** `assume()` — filter out invalid inputs.
- The link to [`pricing.py`](examples/src/shop/pricing.py).

---

## Installation

Already in the dev deps of [`examples/pyproject.toml`](examples/pyproject.toml).

```bash
pip install -e ".[dev]"
```

---

## The first property test

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

Hypothesis runs **many** examples in a single test.

---

## Strategies

| Strategy | Generates |
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

Don't generate invalid inputs — for invalid use a separate **unit** test with `pytest.raises`.

---

## shrinking demo

```python
# an intentionally broken property:
@given(st.integers(min_value=0, max_value=100))
def test_wrong(p):
    assert p < 10  # fails
```

Running it will show the **minimal** counterexample — often `p=10`.

---

## settings

```python
from hypothesis import settings, given, strategies as st

@settings(max_examples=500, deadline=1000)
@given(st.integers())
def test_heavy(n):
    ...
```

`deadline` — ms per example; useful for slow tests.

---

## vs parametrize

| parametrize | Hypothesis |
|-------------|------------|
| you **define** the cases | generates + shrinks |
| deterministic | seed reproducible (`@seed`) |
| business examples | invariant properties |

Use **both**: parametrize for known bugs, Hypothesis for invariants.

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| float strategy for money | rounding | st.decimals |
| Too broad a domain | many assume rejects | narrow the strategy |
| Property = restate implementation | tautology | test an invariant |
| max_examples=10000 in CI | slow | default 100 |

## Interview questions

- What is **shrinking**?
- An example **property** for pricing?

## Summary

Hypothesis — invariants over a set of inputs. decimals + integers for shop. assume filters; shrinking finds the minimal fail. Complements parametrize.

Next: [17-lab-hypothesis](17-lab-hypothesis.md).
