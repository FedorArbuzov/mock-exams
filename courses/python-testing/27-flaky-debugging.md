# 27. Flaky tests, debugging, xfail, quarantine

## Введение: «перезапустил job — зелёный»

Flaky test стоит команды **больше**, чем отсутствие test: теряется trust в CI. Нужны **диагностика**, **quarantine**, **fix root cause** — не `sleep(1)` без причины.

## Что вы узнаете

- **Причины** flakiness: order, time, network, random.
- **`pytest --lf`**, **`--pdb`**, **`caplog`**.
- **Quarantine**: xfail, marker `flaky`, separate job.
- **freezegun** для time.

---

## Источники flakiness

| Источник | Пример | Fix |
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

Уже в dev deps [`pyproject.toml`](examples/pyproject.toml).

---

## Quarantine flaky

```python
import pytest


@pytest.mark.flaky(reruns=3)  # pytest-rerunfailures plugin — optional
@pytest.mark.xfail(reason="SHOP-99: race in cart merge")
def test_known_flaky():
    ...
```

**Policy:** xfail с ticket + deadline; не permanent.

---

## pytest-random-order (optional)

```bash
pip install pytest-random-order
pytest --random-order
```

Ловит order-dependent tests.

---

## CI policy

| State | Action |
|-------|--------|
| Flaky reproduced | open bug |
| Short-term | xfail + ticket |
| MR blocking | fix or quarantine in separate job |
| Never | delete test silently |

---

## caplog debugging

```python
def test_debug(caplog):
    caplog.set_level("DEBUG")
    # run code
    print(caplog.text)  # temp
```

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| sleep(2) in test | slow + still flaky | mock time |
| rerun forever | hides bugs | fix root cause |
| xfail без ticket | debt forever | JIRA link |
| disable test file | coverage hole | quarantine marker |

## На собеседовании

- Top 3 причины flaky?
- xfail vs skip vs fix?

## Резюме

Flaky — trust killer. Debug: --lf, --pdb, caplog. freezegun for time. xfail quarantine with ticket. random-order finds order deps.

Далее: [28-capstone](28-capstone.md).
