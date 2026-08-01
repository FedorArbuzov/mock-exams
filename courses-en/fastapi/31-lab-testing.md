# 31. Lab: writing API tests

## Lab goal

Add a `tests/` directory with **unit**, **integration**, and a minimal **e2e** smoke to the [`deploy/fastapi`](../../deploy/fastapi/README.md) stand project. Run it in the container and locally; optionally — a job in GitLab CI.

Theory: [30-testing](30-testing.md). Structure: [examples/project-layout.md](examples/project-layout.md).

---

## Prerequisites

```bash
cd deploy/fastapi
docker compose up -d --build
```

Confirm the API responds: `curl -s http://localhost:8090/health`.

---

## Task 1. Dependencies and pytest.ini

In `stack/api/requirements.txt` (or the dev group in [examples/pyproject.toml](examples/pyproject.toml)):

```text
pytest>=8.0
pytest-asyncio>=0.23
httpx>=0.27
```

Create `stack/api/pytest.ini`:

```ini
[pytest]
asyncio_mode = auto
testpaths = tests
pythonpath = .
```

**Verification:** `docker compose exec api pytest --collect-only` — a list of tests with no import errors.

---

## Task 2. conftest.py and AsyncClient

File `tests/conftest.py`:

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

**Verification:** `tests/test_health.py` with a single test `test_health_ok`.

---

## Task 3. items API tests

Create `tests/integration/test_items.py`:

| Test | Expectation |
|------|----------|
| `test_list_items` | 200, `items` list, `total` int |
| `test_get_item_found` | 200, `id` matches |
| `test_get_item_not_found` | 404 or JSON with detail |

```python
@pytest.mark.asyncio
async def test_list_items(client):
    r = await client.get("/api/v1/items")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data["items"], list)
    assert data["total"] >= 0
```

If a cache was added after [29-lab-redis](29-lab-redis.md), the test must **not** depend on Redis (override `get_redis` or a test compose profile).

---

## Task 4. Override Redis (if there's a cache)

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

Test `test_get_item_without_redis` with the `fake_redis` fixture — data from the source.

---

## Task 5. Rate limit test (if implemented)

```python
@pytest.mark.asyncio
async def test_rate_limit_returns_429(client):
    for _ in range(12):
        r = await client.post("/api/v1/items", json={"title": "x"})
    assert r.status_code == 429
```

Use a **separate** Redis DB (`/15`) in the tests, or flush `rl:*` keys in fixture teardown.

---

## Task 6. Unit test of a Pydantic schema

`tests/unit/test_schemas.py` — validating boundary values:

```python
import pytest
from pydantic import ValidationError
from app.schemas.item import ItemCreate

def test_title_required():
    with pytest.raises(ValidationError):
        ItemCreate(description="no title")
```

If there's no schema yet — create a minimal `ItemCreate` with `title: str`.

---

## Task 7. Running in Docker and coverage

```bash
docker compose exec api pytest -v --tb=short
docker compose exec api pytest --cov=app --cov-report=term-missing
```

Goal: **≥ 70%** coverage on `app/routers` and `app/schemas` (don't chase 100% on `main.py`).

---

## Task 8. CI (optional)

A `.gitlab-ci.yml` fragment modeled on [gitlab-basic/04-lab-first-pipeline](../gitlab-basic/04-lab-first-pipeline.md):

```yaml
test:api:
  image: python:3.12-slim
  script:
    - pip install -r stack/api/requirements.txt
    - cd stack/api && pytest -v
```

Or `docker compose run --rm api pytest` — closer to prod parity.

---

## Submission criteria

| Criterion | Required |
|----------|-------------|
| `pytest` green in the container | yes |
| ≥ 5 integration tests | yes |
| ≥ 2 unit tests of schemas | yes |
| conftest + AsyncClient | yes |
| No hardcoded localhost:8090 in unit/integration | yes |

---

## Troubleshooting

| Symptom | Action |
|---------|----------|
| `ModuleNotFoundError: app` | `pythonpath = .` in pytest.ini, cwd `stack/api` |
| Flaky rate limit | isolate the Redis DB / fakeredis |
| Event loop closed | `asyncio_mode = auto`, don't mix TestClient and async |

---

## Summary

This lab reinforces the **test pyramid**: fast unit tests on Pydantic, integration on the routers via **AsyncClient**, e2e as the stand's smoke. **Overrides** decouple the tests from Redis/the DB.

## Checklist

- Where does `conftest.py` live and why?
- How do you run only integration?
- Why don't the tests hit `localhost:8090`?
- What would you add to the CI pipeline?

Next lesson: [32-contract-tests](32-contract-tests.md).
