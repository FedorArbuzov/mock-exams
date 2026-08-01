# 28. Lab: testing async

## Lab goal

Write **unit** tests with AsyncMock, an **integration** test against gateway **8095**, and a **cache-aside** test from lab 22 with fake Redis.

## Prerequisites

- [27-pytest-asyncio](27-pytest-asyncio.md).
- Code from [22-lab-redis-async](22-lab-redis-async.md) (or copy `get_summary`).
- `pip install pytest pytest-asyncio httpx redis`

```bash
mkdir -p tests labs
```

---

## Task 1. pytest.ini

`pytest.ini` at the lab project root:

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
```

---

## Task 2. Unit: retry helper

Extract from [06-lab-concurrent-io](06-lab-concurrent-io.md):

```python
# labs/fetch_utils.py
import asyncio
import httpx

async def fetch_with_retry(
    client: httpx.AsyncClient,
    url: str,
    attempts: int = 3,
) -> httpx.Response:
    last: Exception | None = None
    for i in range(attempts):
        try:
            r = await client.get(url)
            r.raise_for_status()
            return r
        except httpx.HTTPStatusError as e:
            last = e
            await asyncio.sleep(0.01 * (i + 1))
    raise last  # type: ignore
```

`tests/test_fetch_utils.py`:

```python
from unittest.mock import AsyncMock, MagicMock
import httpx
import pytest

from labs.fetch_utils import fetch_with_retry

@pytest.mark.asyncio
async def test_retry_succeeds_second_attempt():
    client = AsyncMock()
    bad = MagicMock(status_code=503)
    bad.raise_for_status.side_effect = httpx.HTTPStatusError(
        "err", request=MagicMock(), response=bad
    )
    good = MagicMock(status_code=200)
    good.raise_for_status = MagicMock()
    client.get.side_effect = [bad, good]

    r = await fetch_with_retry(client, "http://x/fail")
    assert r.status_code == 200
    assert client.get.await_count == 2
```

**Run:** `pytest tests/test_fetch_utils.py -v`

---

## Task 3. Integration: health 8095

```python
# tests/test_gateway_integration.py
import os
import pytest
import httpx

pytestmark = pytest.mark.skipif(
    os.getenv("RUN_INTEGRATION") != "1",
    reason="RUN_INTEGRATION=1 required",
)

BASE = "http://localhost:8095"

@pytest.fixture
async def client():
    async with httpx.AsyncClient(base_url=BASE, timeout=30.0) as c:
        yield c

@pytest.mark.asyncio
async def test_health(client: httpx.AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json().get("status") == "ok"

@pytest.mark.asyncio
async def test_aggregate_parallel_faster_than_sequential(client):
    import time
    t0 = time.perf_counter()
    await client.get("/aggregate")
    seq = time.perf_counter() - t0
    t0 = time.perf_counter()
    await client.get("/aggregate-parallel")
    par = time.perf_counter() - t0
    assert par < seq * 0.85
```

```bash
cd deploy/python-async && docker compose up -d
RUN_INTEGRATION=1 pytest tests/test_gateway_integration.py -v
```

**What you should see:** parallel faster than sequential by ~2×.

---

## Task 4. Fake Redis for cache

```python
# tests/fake_redis.py
class FakeRedis:
    def __init__(self):
        self._store: dict[str, str] = {}

    async def get(self, key: str):
        return self._store.get(key)

    async def setex(self, key: str, ttl: int, value: str):
        self._store[key] = value

    async def delete(self, key: str):
        self._store.pop(key, None)

    async def aclose(self):
        pass
```

```python
# tests/test_cache_unit.py
import json
import pytest
from unittest.mock import AsyncMock

@pytest.mark.asyncio
async def test_cache_hit_skips_db(monkeypatch):
    from tests.fake_redis import FakeRedis

    fake = FakeRedis()
    await fake.setex("cache:k", 30, json.dumps({"n": 1}))

    db_mock = AsyncMock()
    async def get_summary(rds):
        cached = await rds.get("cache:k")
        if cached:
            return json.loads(cached)
        db_mock()
        return {"n": 0}

    result = await get_summary(fake)
    assert result == {"n": 1}
    db_mock.assert_not_called()
```

---

## Task 5. Timeout: hanging coroutine

```python
import asyncio
import pytest

@pytest.mark.asyncio
async def test_hang_detected():
    async def hang():
        await asyncio.sleep(10)

    with pytest.raises(TimeoutError):
        async with asyncio.timeout(0.1):
            await hang()
```

**What you should see:** the test finishes in ~0.1 s, not 10 s.

---

## Task 6. conftest: markers

`tests/conftest.py`:

```python
import pytest

def pytest_configure(config):
    config.addinivalue_line("markers", "integration: needs docker stacks")
```

Run unit only: `pytest -m "not integration"` (add the marker on the integration file).

---

## If it doesn't work

| Symptom | Action |
|---------|--------|
| PytestUnraisableExceptionWarning | close clients in fixtures |
| integration skipped | `RUN_INTEGRATION=1` |
| aggregate timing flaky | raise threshold 0.85 → 0.9 |
| import labs | `PYTHONPATH=.` or `pip install -e .` |

---

## Success criteria

- [ ] Unit retry test with AsyncMock is green
- [ ] Integration health + aggregate timing (with the stand)
- [ ] Cache hit test without calling DB
- [ ] Timeout test catches hang
- [ ] You understand the skip marker for CI

---

## Cleanup

Unit tests do not need Docker. Stop the stand if needed.

---

## Self-check questions

1. Why are integration tests behind an env flag?
2. When is FakeRedis better than testcontainers Redis?
3. How do you test TaskGroup cancellation?
4. Where are the tests in [36-capstone](36-capstone.md)?

Next lesson: [29. Debug and profiling](29-debug-profiling.md).
