# 32. Contract tests: OpenAPI и Schemathesis

## Введение: «клиент сломался — мы поменяли поле»

Мобильное приложение ожидает `user_id: int`, бэкенд после рефакторинга отдаёт `userId: string` — OpenAPI обновился, а **потребители** узнали в проде. Contract testing фиксирует **соглашение** между API и клиентами до деплоя.

## Что вы узнаете

- OpenAPI как **источник правды** в FastAPI.
- Валидация ответов против схемы.
- **Schemathesis** — property-based тесты из spec.
- Breaking vs non-breaking changes.
- CI gate на контракт ([gitlab-basic](../gitlab-basic/README.md)).

---

## OpenAPI в FastAPI

FastAPI генерирует схему автоматически:

| URL | Формат |
|-----|--------|
| `/openapi.json` | JSON Schema |
| `/docs` | Swagger UI |
| `/redoc` | ReDoc |

```python
app = FastAPI(
    title="Task API",
    version="1.2.0",
    openapi_tags=[{"name": "items", "description": "CRUD items"}],
)
```

**Правило:** response_model и status_code в декораторе — не «документация», а **контракт**.

```python
@router.get("/{id}", response_model=ItemOut, responses={404: {"model": ErrorOut}})
async def get_item(id: int) -> ItemOut:
    ...
```

---

## Экспорт и diff схемы

```bash
curl -s http://localhost:8090/openapi.json | jq . > openapi-baseline.json
# после изменений
diff openapi-baseline.json openapi-new.json
```

В CI храните **committed** `openapi.json` или генерируйте в job и сравнивайте — breaking change = failed pipeline.

Связь с versioning: [39-versioning-idempotency](39-versioning-idempotency.md).

---

## Валидация ответов в pytest

Библиотека `openapi-spec-validator` или ручная проверка через `jsonschema`:

```python
import json
import jsonschema
import pytest

@pytest.fixture(scope="session")
def openapi_schema():
    with open("openapi.json") as f:
        return json.load(f)

def test_list_items_matches_schema(client, openapi_schema):
    r = client.get("/api/v1/items")
    assert r.status_code == 200
    # resolve $ref для operationId list_items...
    jsonschema.validate(r.json(), resolved_response_schema)
```

Проще — доверить это Schemathesis.

---

## Schemathesis overview

[Schemathesis](https://schemathesis.readthedocs.io/) читает OpenAPI и **генерирует** запросы, ища 5xx и несоответствия схеме.

```bash
pip install schemathesis
st run http://localhost:8090/openapi.json --checks all
```

| Check | Что ловит |
|-------|-----------|
| not_a_server_error | 5xx |
| status_code_conformance | код не из spec |
| content_type_conformance | неверный Content-Type |
| response_schema_conformance | JSON не по схеме |

**Hypothesis** под капотом — граничные значения, пустые строки, огромные int.

```bash
# только GET, base-url для reverse proxy
st run openapi.json --base-url=http://localhost:8090 \
  --hypothesis-max-examples=50 \
  --endpoint="/api/v1/items"
```

На стенде [`deploy/fastapi`](../../deploy/fastapi/README.md): поднимите compose, прогоните `st run` против `/openapi.json`.

---

## Auth в contract tests

```bash
st run openapi.json \
  --header "Authorization: Bearer ${TEST_TOKEN}" \
  --auth-type=bearer
```

Или `--hooks` Python-файл: логин перед protected endpoints.

---

## Stateful testing (preview)

Schemathesis 3.x поддерживает **state machine** из OpenAPI links — цепочки «create → get → delete». Полезно для CRUD; настройка сложнее stateless run.

---

## Breaking vs non-breaking

| Change | Тип |
|--------|-----|
| Добавить optional field в response | non-breaking |
| Удалить field | **breaking** |
| Сменить тип `id` int → string | **breaking** |
| Новый required query param | **breaking** |
| Новый endpoint | non-breaking |
| Deprecate header | non-breaking с sunset |

Политика: **semver API** + changelog; mobile clients отстают на 2 версии.

---

## CI pipeline

```yaml
contract-test:
  script:
    - docker compose up -d api
    - pip install schemathesis
    - st run http://api:8000/openapi.json --base-url=http://api:8000 \
        --checks all --hypothesis-max-examples=100
  allow_failure: false
```

Параллельно: `openapi-diff` между `main` и MR branch.

См. [gitlab-basic/04-lab-first-pipeline](../gitlab-basic/04-lab-first-pipeline.md).

---

## Ограничения

| Ограничение | Обход |
|-------------|-------|
| Не знает бизнес-инварианты | доп. pytest cases |
| Может DDoSить тестовую БД | `--workers=1`, test DB, rate limit off |
| WebSocket не в OAS 3.0 paths | отдельные тесты |
| 401 на всём API | hooks / test token |

---

## Резюме

**OpenAPI** в FastAPI — живой контракт. **Schemathesis** автоматизирует поиск 5xx и schema drift. В CI: `st run` + diff схемы на MR. Это дополняет, не заменяет [31-lab-testing](31-lab-testing.md).

## Чек-лист

- Где взять OpenAPI spec у FastAPI?
- Что проверяет `response_schema_conformance`?
- Пример breaking change?
- Зачем committed `openapi.json`?

Следующий урок: [33-docker-production](33-docker-production.md).
