# 09. monkeypatch, capsys, caplog, tmp_path

## Intro: "a test changes os.environ for everyone"

A test set `os.environ["API_URL"] = "prod"` — the next test failed. pytest's **monkeypatch** automatically **rolls back** env, attrs, and dicts after a test. **capsys** captures stdout — for DevOps CLI scripts.

## What you'll learn

- **`monkeypatch.setenv` / `delenv` / `setattr`**.
- **`capsys`** — stdout/stderr.
- **`caplog`** — logging records.
- **`tmp_path`** — temporary files.
- The link to [`linux-shell`](../linux-shell/README.md) — testing bash wrappers.

---

## monkeypatch

```python
def test_settings_from_env(monkeypatch):
    monkeypatch.setenv("SHOP_API_URL", "http://test.local")
    monkeypatch.setenv("SHOP_DEBUG", "1")
    # import AFTER setenv if module reads env at import time
    from shop import config  # hypothetical
    assert config.API_URL == "http://test.local"
```

| API | Action |
|-----|----------|
| `setenv(name, value)` | env var |
| `delenv(name, raising=True)` | delete |
| `setattr(obj, name, value)` | attribute |
| `setitem(dict, key, val)` | dict entry |
| `syspath_prepend(path)` | import path |

After the test — an **automatic rollback**.

---

## setattr for a temporary override

```python
def test_force_tier(monkeypatch):
    from shop import pricing
    monkeypatch.setattr(pricing, "DEFAULT_TIER2_AT", 3)
    from decimal import Decimal
    assert pricing.bulk_price(Decimal("10"), 3) == Decimal("28.50")
```

Useful for a **branch** without refactoring production code.

---

## capsys

```python
def test_cli_prints_help(capsys):
    from shop.cli import main  # hypothetical CLI
    main(["--help"])
    captured = capsys.readouterr()
    assert "usage:" in captured.out.lower()
    assert captured.err == ""
```

`capsys.disabled()` — skip capture for debugging.

---

## caplog

```python
import logging


def test_logs_warning(caplog):
    caplog.set_level(logging.WARNING)
    # call function that logs
    assert "deprecated" in caplog.text
    assert any(r.levelname == "WARNING" for r in caplog.records)
```

For structured logging — assert on `record.msg` / extra fields.

---

## tmp_path

```python
def test_export_report(tmp_path):
    out_file = tmp_path / "report.json"
    out_file.write_text('{"ok": true}', encoding="utf-8")
    assert out_file.read_text(encoding="utf-8") == '{"ok": true}'
```

`tmp_path` — a **Path** unique per test; pytest deletes it after the session.

| tmp_path | tmp_path_factory |
|----------|------------------|
| one directory per test | create several (session scope fixture) |

---

## import timing trap

```python
# BAD: env read at import
API_URL = os.getenv("API_URL", "default")

# test must monkeypatch BEFORE first import — use fixture scope or lazy settings
```

See [`fastapi/10-settings`](../fastapi/10-settings.md) — the pydantic-settings pattern.

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| import before monkeypatch | flaky test | lazy import / fixture |
| capsys.readouterr twice | empty the second time | one read per phase |
| tmp_path shared manually | collision | don't reuse the Path |
| setattr without monkeypatch | leak | monkeypatch only |

## Interview questions

- Why is **monkeypatch** better than a manual try/finally?
- When **tmp_path** vs mocking file I/O?

## Summary

monkeypatch — safe env/attr override. capsys/caplog — observable output. tmp_path — files without cleanup. Watch import-time side effects.

Next: [10-fakes-stubs](10-fakes-stubs.md).
