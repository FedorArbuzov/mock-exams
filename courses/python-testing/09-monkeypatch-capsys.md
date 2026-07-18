# 09. monkeypatch, capsys, caplog, tmp_path

## Введение: «тест меняет os.environ для всех»

Test выставил `os.environ["API_URL"] = "prod"` — следующий test упал. **monkeypatch** pytest автоматически **откатывает** env, attrs, dict после test. **capsys** ловит stdout — для CLI скриптов DevOps.

## Что вы узнаете

- **`monkeypatch.setenv` / `delenv` / `setattr`**.
- **`capsys`** — stdout/stderr.
- **`caplog`** — logging records.
- **`tmp_path`** — временные файлы.
- Связь с [`linux-shell`](../linux-shell/README.md) — тесты bash-обёрток.

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

| API | Действие |
|-----|----------|
| `setenv(name, value)` | env var |
| `delenv(name, raising=True)` | удалить |
| `setattr(obj, name, value)` | атрибут |
| `setitem(dict, key, val)` | dict entry |
| `syspath_prepend(path)` | import path |

После test — **автоматический rollback**.

---

## setattr для временной подмены

```python
def test_force_tier(monkeypatch):
    from shop import pricing
    monkeypatch.setattr(pricing, "DEFAULT_TIER2_AT", 3)
    from decimal import Decimal
    assert pricing.bulk_price(Decimal("10"), 3) == Decimal("28.50")
```

Полезно для **branch** без refactor production code.

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

`capsys.disabled()` — пропустить capture для debug.

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

Для structured logging — assert на `record.msg` / extra fields.

---

## tmp_path

```python
def test_export_report(tmp_path):
    out_file = tmp_path / "report.json"
    out_file.write_text('{"ok": true}', encoding="utf-8")
    assert out_file.read_text(encoding="utf-8") == '{"ok": true}'
```

`tmp_path` — **Path** unique per test; pytest удаляет после session.

| tmp_path | tmp_path_factory |
|----------|------------------|
| один каталог на test | создавать несколько (session scope fixture) |

---

## import timing trap

```python
# ПЛОХО: env read at import
API_URL = os.getenv("API_URL", "default")

# test must monkeypatch BEFORE first import — use fixture scope or lazy settings
```

См. [`fastapi/10-settings`](../fastapi/10-settings.md) — pydantic-settings pattern.

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| import до monkeypatch | test flaky | lazy import / fixture |
| capsys.readouterr дважды | пусто второй раз | один read per phase |
| tmp_path shared manual | collision | не переиспользуйте Path |
| setattr без monkeypatch | leak | только monkeypatch |

## На собеседовании

- Чем **monkeypatch** лучше ручного try/finally?
- Когда **tmp_path** vs mock file I/O?

## Резюме

monkeypatch — safe env/attr override. capsys/caplog — observable output. tmp_path — файлы без cleanup. Watch import-time side effects.

Далее: [10-fakes-stubs](10-fakes-stubs.md).
