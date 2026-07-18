# 23. Лаба: полный integration suite

## Цель лабы

Собрать **integration/** suite: gateway HTTP + optional postgres ping; документировать **RUN_INTEGRATION** workflow.

## Предварительно

```bash
cd deploy/python-async && docker compose up -d --build
bash scripts/smoke.sh
cd ../../courses/python-testing/examples
pip install -e ".[dev]"
```

Теория: [22-testcontainers](22-testcontainers.md), [21-lab-http-mocks](21-lab-http-mocks.md).

---

## Задание 1. tests/integration/README.md

Опишите:

```markdown
# Integration tests

## Quick (no docker)
pytest tests/unit -v

## Full integration
1. deploy/python-async up (:8095)
2. RUN_INTEGRATION=1 pytest tests/integration -v

## Optional postgres
deploy/postgres up, TEST_POSTGRES_DSN=...
```

---

## Задание 2. Gateway suite

Объедините tests из [21-lab-http-mocks](21-lab-http-mocks.md):

- `/health`
- `/json?size=5`
- `/aggregate-parallel`
- `/fail?rate=1.0`

```bash
set RUN_INTEGRATION=1
pytest tests/integration/test_gateway_live.py -v
```

---

## Задание 3. Timing observation (local only)

```python
import time
import httpx
import pytest


@pytest.mark.integration
@pytest.mark.slow
def test_parallel_faster_than_sequential(live_base_url):
    t0 = time.perf_counter()
    httpx.get(f"{live_base_url}/aggregate", timeout=60)
    seq = time.perf_counter() - t0

    t0 = time.perf_counter()
    httpx.get(f"{live_base_url}/aggregate-parallel", timeout=60)
    par = time.perf_counter() - t0

    assert par < seq, f"seq={seq:.2f}s par={par:.2f}s"
```

**Не** включайте в MR CI — marker `slow`.

---

## Задание 4. Optional postgres

Если [`deploy/postgres`](../../deploy/postgres/README.md) up:

```python
@pytest.mark.integration
def test_postgres_select_one():
    import os
    dsn = os.getenv("TEST_POSTGRES_DSN", "postgresql://course:course@localhost:5432/course")
    try:
        import psycopg
    except ImportError:
        pytest.skip("psycopg not installed")
    with psycopg.connect(dsn) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            assert cur.fetchone()[0] == 1
```

---

## Задание 5. CI matrix documentation

В `tests/integration/README.md` добавьте таблицу jobs:

| Job | Command | When |
|-----|---------|------|
| unit | `pytest tests/unit --cov=shop --cov-fail-under=85` | every MR |
| integration | `RUN_INTEGRATION=1 pytest tests/integration` | nightly |

---

## Если не working

| Симптом | Действие |
|---------|----------|
| 8095 refused | smoke.sh |
| timing flake | skip in CI, local only |
| postgres auth | deploy/postgres README |

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | integration README complete |
| 2 | ≥4 gateway tests pass |
| 3 | unit job без docker |
| 4 | slow timing test marked |

## Уборка

—

## Вопросы для самопроверки

1. Почему timing test — slow?
2. Как разделить MR vs nightly?

Далее: [24-pytest-asyncio](24-pytest-asyncio.md).
