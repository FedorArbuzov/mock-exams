# 28. Лаба: testing async

## Цель лабы

Написать **unit** тесты с AsyncMock, **integration** тест против gateway **8095**, и тест **cache-aside** из лабы 22 с fake Redis.

## Предварительно

- [27-pytest-asyncio](27-pytest-asyncio.md).
- Код из [22-lab-redis-async](22-lab-redis-async.md) (или скопируйте `get_summary`).
- `pip install pytest pytest-asyncio httpx redis`

```bash
mkdir -p tests labs
```

---

## Задание 1. pytest.ini

`pytest.ini` в корне проекта лаб:

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
```

---

## Задание 2. Unit: retry helper

Вынесите из [06-lab-concurrent-io](06-lab-concurrent-io.md):

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

**Запуск:** `pytest tests/test_fetch_utils.py -v`

---

## Задание 3. Integration: health 8095

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

**Что увидите:** parallel быстрее sequential ~2×.

---

## Задание 4. Fake Redis для cache

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

## Задание 5. Timeout: зависающая корутина

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

**Что увидите:** тест завершается за ~0.1 s, не 10 s.

---

## Задание 6. conftest: маркеры

`tests/conftest.py`:

```python
import pytest

def pytest_configure(config):
    config.addinivalue_line("markers", "integration: needs docker stacks")
```

Запуск только unit: `pytest -m "not integration"` (добавьте marker на integration file).

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| PytestUnraisableExceptionWarning | закройте clients в fixtures |
| integration skipped | `RUN_INTEGRATION=1` |
| aggregate timing flaky | увеличьте порог 0.85 → 0.9 |
| import labs | `PYTHONPATH=.` или `pip install -e .` |

---

## Критерии успеха

- [ ] Unit retry test с AsyncMock зелёный
- [ ] Integration health + aggregate timing (со стендом)
- [ ] Cache hit test без вызова DB
- [ ] Timeout test ловит hang
- [ ] Понимаете skip marker для CI

---

## Уборка

Unit-тесты не требуют Docker. Остановите стенд при необходимости.

---

## Вопросы для самопроверки

1. Почему integration вынесены за env flag?
2. Когда FakeRedis лучше testcontainers Redis?
3. Как тестировать TaskGroup cancellation?
4. Где тесты в [36-capstone](36-capstone.md)?

Следующий урок: [29. Debug и profiling](29-debug-profiling.md).
