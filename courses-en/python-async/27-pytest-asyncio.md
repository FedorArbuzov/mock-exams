# 27. pytest-asyncio: testing async code

## Intro: “tests pass, but CI hangs for 60 seconds”

Async production code without async tests is a lottery: a forgotten `await`, an unclosed client, a race on a mock — in pytest everything either **stays silent** or **hangs**. **pytest-asyncio** runs coroutines on a loop, provides **async fixtures**, and integrates with **httpx mock**.

Lab — [28-lab-testing-async](28-lab-testing-async.md). FastAPI TestClient patterns — [27-async-patterns](../fastapi/27-async-patterns.md).

## What you'll learn

- **`pytest.mark.asyncio`** and **auto / strict** modes.
- **Async fixtures** with the right scope.
- **AsyncMock**, monkeypatch of async functions.
- Loop isolation between tests.

---

## Install and minimal test

```bash
pip install pytest pytest-asyncio httpx
```

`pytest.ini` or `pyproject.toml`:

```ini
[pytest]
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function
```

```python
# tests/test_basic_async.py
import asyncio
import pytest

async def double(x: int) -> int:
    await asyncio.sleep(0.01)
    return x * 2

@pytest.mark.asyncio
async def test_double():
    assert await double(3) == 6
```

`asyncio_mode = auto` — the marker is not required on every test (pytest-asyncio 0.24+).

---

## Async fixtures

```python
import pytest
import httpx

@pytest.fixture
async def http_client():
    async with httpx.AsyncClient(base_url="http://localhost:8095") as client:
        yield client
    # client closed after the test

@pytest.mark.asyncio
async def test_health(http_client: httpx.AsyncClient):
    r = await http_client.get("/health")
    assert r.status_code == 200
```

| scope | When |
|-------|------|
| `function` | default — isolation, own loop |
| `session` | expensive engine; be careful with shared state |
| `module` | rare for async DB |

**Rule:** fixtures with `yield` **must** be async if setup/teardown awaits.

---

## AsyncMock

```python
from unittest.mock import AsyncMock
import pytest

async def fetch_status(client) -> int:
    r = await client.get("/health")
    return r.status_code

@pytest.mark.asyncio
async def test_fetch_status_mocked():
    client = AsyncMock()
    client.get.return_value.status_code = 200
    assert await fetch_status(client) == 200
    client.get.assert_awaited_once()
```

| Sync Mock | AsyncMock |
|-----------|-----------|
| `return_value` | `return_value` / `side_effect` async def |
| `assert_called_once` | **`assert_awaited_once`** |

---

## monkeypatch async

```python
@pytest.mark.asyncio
async def test_patch_async(monkeypatch):
    async def fake_load():
        return {"cached": True}

    monkeypatch.setattr("myapp.cache.load_summary_from_db", fake_load)
    # ...
```

The path in `setattr` is where the function is **used** (import site), not where it is defined.

---

## pytest.raises and ExceptionGroup

```python
import asyncio
import pytest

@pytest.mark.asyncio
async def test_taskgroup_raises():
    async def boom():
        raise ValueError("x")

    with pytest.raises(ExceptionGroup):
        async with asyncio.TaskGroup() as tg:
            tg.create_task(boom())
```

Python 3.11+: `pytest.raises(ExceptionGroup)` or `except*` in the code under test.

---

## Timeouts in tests

```python
@pytest.mark.asyncio
async def test_slow():
    async with asyncio.timeout(2.0):
        await asyncio.sleep(0.1)
```

Globally: `pytest-timeout` plugin — `@pytest.mark.timeout(5)`.

A **hanging test** often means an unclosed resource or a missing `await`.

---

## Parametrization

```python
@pytest.mark.asyncio
@pytest.mark.parametrize("path", ["/health", "/json?size=1"])
async def test_paths(http_client, path):
    r = await http_client.get(path)
    assert r.status_code == 200
```

---

## Common mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Forgot `await` in the test | coroutine never awaited warning | `await` |
| Sync fixture closes async client | RuntimeError loop closed | async fixture |
| Shared global client | order-dependent failures | fixture per test |
| `asyncio.run()` inside a test | nested loop error | pytest-asyncio only |
| Mock without AsyncMock | coroutine not awaited | AsyncMock |

---

## tests/ layout

```
tests/
  conftest.py      # event_loop policy, shared markers
  test_fetch.py
  test_cache.py
labs/
  ...
```

`conftest.py` example:

```python
import pytest

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"
```

(for httpx/anyio optional; pytest-asyncio is enough for pure asyncio)

---

## On the stand

Integration tests against **8095** — mark with `@pytest.mark.integration` and skip without the stand:

```python
import os
import pytest

pytestmark = pytest.mark.skipif(
    os.getenv("RUN_INTEGRATION") != "1",
    reason="set RUN_INTEGRATION=1 and start deploy/python-async",
)
```

```bash
cd deploy/python-async && docker compose up -d
RUN_INTEGRATION=1 pytest tests/ -v
```

---

## Summary

**pytest-asyncio** is the standard for unit and integration async tests. Use **async fixtures**, **AsyncMock**, **short scope**, **timeouts**. A test should catch the same bugs as the production loop.

## Checklist

- Why `asyncio_mode = auto`?
- How does `assert_awaited_once` differ from `assert_called_once`?
- Why is a session-scoped async engine dangerous?
- How do you mark tests that need a Docker stand?

Next lesson: [28. Lab: testing async](28-lab-testing-async.md).
