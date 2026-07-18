# 27. pytest-asyncio: тестирование async-кода

## Введение: «тесты проходят, но в CI зависают на 60 секунд»

Async production-код без async-тестов — лотерея: забытый `await`, незакрытый client, гонка на mock — в pytest всё **молчит** или **висит**. **pytest-asyncio** запускает корутины в loop, даёт **async fixtures** и интеграцию с **httpx mock**.

Лаба — [28-lab-testing-async](28-lab-testing-async.md). Паттерны FastAPI TestClient — [27-async-patterns](../fastapi/27-async-patterns.md).

## Что вы узнаете

- **`pytest.mark.asyncio`** и режимы **auto / strict**.
- **Async fixtures** с правильным scope.
- **AsyncMock**, monkeypatch async функций.
- Изоляция loop между тестами.

---

## Установка и минимальный тест

```bash
pip install pytest pytest-asyncio httpx
```

`pytest.ini` или `pyproject.toml`:

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

`asyncio_mode = auto` — маркер не обязателен на каждом тесте (pytest-asyncio 0.24+).

---

## Async fixtures

```python
import pytest
import httpx

@pytest.fixture
async def http_client():
    async with httpx.AsyncClient(base_url="http://localhost:8095") as client:
        yield client
    # client закрыт после теста

@pytest.mark.asyncio
async def test_health(http_client: httpx.AsyncClient):
    r = await http_client.get("/health")
    assert r.status_code == 200
```

| scope | Когда |
|-------|-------|
| `function` | default — изоляция, свой loop |
| `session` | дорогой engine; осторожно с shared state |
| `module` | редко для async DB |

**Правило:** fixtures с `yield` **должны** быть async, если setup/teardown await.

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

Путь в `setattr` — где функция **используется** (import site), не где определена.

---

## pytest.raises и ExceptionGroup

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

Python 3.11+: `pytest.raises(ExceptionGroup)` или `except*` в тестируемом коде.

---

## Таймауты в тестах

```python
@pytest.mark.asyncio
async def test_slow():
    async with asyncio.timeout(2.0):
        await asyncio.sleep(0.1)
```

Глобально: `pytest-timeout` plugin — `@pytest.mark.timeout(5)`.

**Зависающий тест** часто = незакрытый resource или missing `await`.

---

## Параметризация

```python
@pytest.mark.asyncio
@pytest.mark.parametrize("path", ["/health", "/json?size=1"])
async def test_paths(http_client, path):
    r = await http_client.get(path)
    assert r.status_code == 200
```

---

## Типичные ошибки

| Ошибка | Симптом | Fix |
|--------|---------|-----|
| Забыли `await` в тесте | coroutine never awaited warning | `await` |
| Sync fixture закрывает async client | RuntimeError loop closed | async fixture |
| Shared global client | order-dependent failures | fixture per test |
| `asyncio.run()` внутри теста | nested loop error | только pytest-asyncio |
| Mock без AsyncMock | coroutine not awaited | AsyncMock |

---

## Структура tests/

```
tests/
  conftest.py      # event_loop policy, shared markers
  test_fetch.py
  test_cache.py
labs/
  ...
```

`conftest.py` пример:

```python
import pytest

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"
```

(для httpx/anyio optional; pytest-asyncio достаточно для чистого asyncio)

---

## На стенде

Интеграционные тесты против **8095** — помечайте `@pytest.mark.integration` и пропускайте без стенда:

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

## Резюме

**pytest-asyncio** — стандарт для unit и integration async-тестов. Используйте **async fixtures**, **AsyncMock**, **короткий scope**, **таймауты**. Тест должен ловить те же баги, что production loop.

## Чек-лист

- Зачем `asyncio_mode = auto`?
- Чем `assert_awaited_once` отличается от `assert_called_once`?
- Почему session-scoped async engine опасен?
- Как пометить тесты, требующие Docker стенд?

Следующий урок: [28. Лаба: testing async](28-lab-testing-async.md).
