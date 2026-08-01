# 27. Flaky tests, debugging, xfail, quarantine

## Intro: "re-ran the job — green"

A flaky test costs the team **more** than having no test: trust in CI is lost. You need **diagnosis**, **quarantine**, and to **fix the root cause** — not a `sleep(1)` for no reason.

## What you'll learn

- The **causes** of flakiness: order, time, network, random.
- **`pytest --lf`**, **`--pdb`**, **`caplog`**.
- **Quarantine**: xfail, the `flaky` marker, a separate job.
- **freezegun** for time.

---

## Sources of flakiness

| Source | Example | Fix |
|----------|--------|-----|
| Shared state | global cart | fixtures |
| Real time | `datetime.now()` | freezegun |
| Network | live HTTP | mock/responses |
| Random | no seed | `@seed` / fix seed |
| Order | depends on collect order | isolate |
| Thread/async race | background task | await cleanup |

---

## Debugging workflow

```bash
pytest tests/unit/test_cart.py -vv --tb=long
pytest --lf -vv                    # last failed
pytest -k test_name -vv --pdb      # drop into pdb on fail
pytest -s                          # no capture stdout
```

| Flag | When |
|------|------|
| `--pdb` | inspect locals at fail |
| `-s` | print/debug output |
| `--log-cli-level=DEBUG` | logging |

---

## freezegun

```python
from freezegun import freeze_time
from datetime import datetime


@freeze_time("2026-06-05 12:00:00")
def test_created_at():
    assert datetime.now().year == 2026
```

Already in the dev deps of [`pyproject.toml`](examples/pyproject.toml).

---

## Quarantine flaky

```python
import pytest


@pytest.mark.flaky(reruns=3)  # pytest-rerunfailures plugin — optional
@pytest.mark.xfail(reason="SHOP-99: race in cart merge")
def test_known_flaky():
    ...
```

**Policy:** xfail with a ticket + deadline; not permanent.

---

## pytest-random-order (optional)

```bash
pip install pytest-random-order
pytest --random-order
```

Catches order-dependent tests.

---

## CI policy

| State | Action |
|-------|--------|
| Flaky reproduced | open a bug |
| Short-term | xfail + ticket |
| MR blocking | fix or quarantine in a separate job |
| Never | delete the test silently |

---

## caplog debugging

```python
def test_debug(caplog):
    caplog.set_level("DEBUG")
    # run code
    print(caplog.text)  # temp
```

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| sleep(2) in a test | slow + still flaky | mock time |
| rerun forever | hides bugs | fix root cause |
| xfail without a ticket | debt forever | JIRA link |
| disable a test file | coverage hole | quarantine marker |

## Interview questions

- Top 3 causes of flaky tests?
- xfail vs skip vs fix?

## Summary

Flaky — a trust killer. Debug: --lf, --pdb, caplog. freezegun for time. xfail quarantine with a ticket. random-order finds order deps.

Next: [28-capstone](28-capstone.md).
