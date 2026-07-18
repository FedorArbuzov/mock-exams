# 31. Лаба: написание тестов API

## Цель лабы

Добавить в проект стенда [`deploy/fastapi`](../../deploy/fastapi/README.md) каталог `tests/` с **unit**, **integration** и минимальным **e2e** smoke. Запуск в контейнере и локально; опционально — job в GitLab CI.

Теория: [30-testing](30-testing.md). Структура: [examples/project-layout.md](examples/project-layout.md).

---

## Предварительно

```bash
cd deploy/fastapi
docker compose up -d --build
```

Убедитесь, что API отвечает: `curl -s http://localhost:8090/health`.

---

## Задание 1. Зависимости и pytest.ini

В `stack/api/requirements.txt` (или dev-группа в [examples/pyproject.toml](examples/pyproject.toml)):

```text
pytest>=8.0
pytest-asyncio>=0.23
httpx>=0.27
```

Создайте `stack/api/pytest.ini`:

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
pythonpath = .
```

**Проверка:** `docker compose exec api pytest --collect-only` — список тестов без ошибок импорта.

---

## Задание 2. conftest.py и AsyncClient

Файл `tests/conftest.py`:

```python
import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
```

**Проверка:** `tests/test_health.py` с одним тестом `test_health_ok`.

---

## Задание 3. Тесты items API

Создайте `tests/integration/test_items.py`:

| Тест | Ожидание |
|------|----------|
| `test_list_items` | 200, `items` list, `total` int |
| `test_get_item_found` | 200, `id` совпадает |
| `test_get_item_not_found` | 404 или JSON с detail |

```python
@pytest.mark.asyncio
async def test_list_items(client):
    r = await client.get("/api/v1/items")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data["items"], list)
    assert data["total"] >= 0
```

Если после [29-lab-redis](29-lab-redis.md) добавлен кэш — тест **не** должен зависеть от Redis (override `get_redis` или тестовый compose profile).

---

## Задание 4. Override Redis (если есть кэш)

```python
class FakeRedis:
    async def get(self, key): return None
    async def set(self, *a, **k): return True
    async def aclose(self): pass

@pytest.fixture
def fake_redis():
    app.dependency_overrides[get_redis] = lambda: FakeRedis()
    yield
    app.dependency_overrides.clear()
```

Тест `test_get_item_without_redis` с fixture `fake_redis` — данные из источника.

---

## Задание 5. Тест rate limit (если реализован)

```python
@pytest.mark.asyncio
async def test_rate_limit_returns_429(client):
    for _ in range(12):
        r = await client.post("/api/v1/items", json={"title": "x"})
    assert r.status_code == 429
```

Используйте **отдельный** Redis DB (`/15`) в тестах или flush ключей `rl:*` в fixture teardown.

---

## Задание 6. Unit-тест схемы Pydantic

`tests/unit/test_schemas.py` — валидация граничных значений:

```python
import pytest
from pydantic import ValidationError
from app.schemas.item import ItemCreate

def test_title_required():
    with pytest.raises(ValidationError):
        ItemCreate(description="no title")
```

Если схемы ещё нет — создайте минимальную `ItemCreate` с `title: str`.

---

## Задание 7. Запуск в Docker и coverage

```bash
docker compose exec api pytest -v --tb=short
docker compose exec api pytest --cov=app --cov-report=term-missing
```

Цель: **≥ 70%** coverage на `app/routers` и `app/schemas` (не гонитесь за 100% на `main.py`).

---

## Задание 8. CI (опционально)

Фрагмент `.gitlab-ci.yml` по образцу [gitlab-basic/04-lab-first-pipeline](../gitlab-basic/04-lab-first-pipeline.md):

```yaml
test:api:
  image: python:3.12-slim
  script:
    - pip install -r stack/api/requirements.txt
    - cd stack/api && pytest -v
```

Или `docker compose run --rm api pytest` — ближе к prod parity.

---

## Критерии сдачи

| Критерий | Обязательно |
|----------|-------------|
| `pytest` зелёный в контейнере | да |
| ≥ 5 integration-тестов | да |
| ≥ 2 unit-теста схем | да |
| conftest + AsyncClient | да |
| Нет хардкода localhost:8090 в unit/integration | да |

---

## Troubleshooting

| Симптом | Действие |
|---------|----------|
| `ModuleNotFoundError: app` | `pythonpath = .` в pytest.ini, cwd `stack/api` |
| Flaky rate limit | изолировать Redis DB / fakeredis |
| Event loop closed | `asyncio_mode = auto`, не смешивать TestClient и async |

---

## Резюме

Лаба закрепляет **пирамиду тестов**: быстрые unit на Pydantic, integration на роутерах через **AsyncClient**, e2e — smoke стенда. **Overrides** отделяют тесты от Redis/БД.

## Чек-лист

- Где лежит `conftest.py` и зачем?
- Как запустить только integration?
- Почему тесты не бьют в `localhost:8090`?
- Что добавить в CI pipeline?

Следующий урок: [32-contract-tests](32-contract-tests.md).
