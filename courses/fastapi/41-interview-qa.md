# 41. FastAPI: 40 вопросов собеседования

Развёрнутые ответы для подготовки к интервью backend/Python. Краткая версия: [interview-cheatsheet](interview-cheatsheet.md).

**Стенды:** [`deploy/fastapi`](../../deploy/fastapi/README.md) · [`deploy/nginx`](../../deploy/nginx/README.md) · [`deploy/observability`](../../deploy/observability/README.md)

---

## Основы и архитектура

### 1. Чем FastAPI отличается от Flask/Django REST?

FastAPI построен на **Starlette** (ASGI) и **Pydantic** (валидация). Нативный **async/await**, автогенерация **OpenAPI**, type hints как контракт. Flask — WSGI, sync-first; Django REST — полный framework с ORM и admin. FastAPI выбирают для **I/O-bound API** с высокой производительностью и строгими схемами.

### 2. Что такое ASGI и зачем он FastAPI?

ASGI — асинхронный интерфейс между сервером (uvicorn, hypercorn) и приложением. Поддерживает WebSocket, long-lived connections, concurrent I/O без блокировки потока. WSGI — один запрос на worker sync-модели.

### 3. Как FastAPI валидирует входные данные?

Через **Pydantic models** (или `Annotated` + validators) в параметрах функции: path, query, body, headers. Ошибки → **422 Unprocessable Entity** с детальным JSON. Валидация до входа в handler — меньше boilerplate, чем ручные `if`.

### 4. Что такое dependency injection в FastAPI?

Функции в `Depends()` резолвятся перед handler: DB session, текущий user, settings. Переопределяются в тестах через `app.dependency_overrides`. Это composition root — не глобальные синглтоны.

### 5. `def` vs `async def` в роутерах?

`async def` — не блокировать event loop; await для DB/HTTP. `def` — FastAPI выполнит в **threadpool** (подходит для CPU-bound или sync ORM). Смешивание: async route + sync blocking call без await **блокирует** весь loop.

---

## Pydantic и схемы

### 6. `response_model` зачем, если и так return dict?

Фильтрация полей (не отдать password), сериализация, **документация OpenAPI**, валидация ответа в dev. `response_model_exclude_unset` — только заданные поля.

### 7. Разница Pydantic v1 и v2?

v2 на **pydantic-core** (Rust) — быстрее, `model_validate`, `ConfigDict` вместо `class Config`. FastAPI 0.100+ ориентирован на v2. Миграция: `from_attributes=True` для ORM.

### 8. Как описать optional и default в query?

`q: str | None = None` или `Query(default=None, max_length=50)`. Distinction: optional vs required с default — влияет на OpenAPI `required`.

### 9. Вложенные модели и списки?

`items: list[ItemCreate]`, вложенность через поля-модели. Для partial update — отдельная `ItemUpdate` с optional полями или `model_dump(exclude_unset=True)`.

### 10. Как валидировать на уровне бизнес-правил?

`@field_validator`, `@model_validator` в Pydantic v2, либо `HTTPException(400)` в сервисном слое после DB-check (уникальность email).

---

## Auth и безопасность

### 11. Как реализовать JWT auth?

`OAuth2PasswordBearer` + dependency: decode JWT, загрузить user. Access short TTL, refresh token отдельно. Секрет не в коде — env/Vault ([gitlab-basic/07](../gitlab-basic/07-variables-secrets.md)).

### 12. OAuth2 scopes в FastAPI?

`SecurityScopes` в dependency, проверка `scope in token.scopes`. OpenAPI показывает required scopes per endpoint.

### 13. CORS — что настроить?

`CORSMiddleware`: `allow_origins` — whitelist, не `*` с credentials. `allow_methods`, `allow_headers`. Preflight OPTIONS обрабатывает middleware.

### 14. Как не светить stack trace клиенту?

Глобальный `exception_handler` → 500 + generic message; детали в log с `request_id`. В dev — `debug=True` или отдельный handler.

### 15. Rate limiting где лучше?

**Edge** (nginx) — DDoS; **app** (Redis) — per-user/API key; оба уровня совместимы ([29-lab-redis](29-lab-redis.md), [34-nginx-tls](34-nginx-tls.md)).

---

## База данных и Redis

### 16. Паттерн session per request?

```python
async def get_db():
    async with session_factory() as session:
        yield session
```

Один session на запрос; commit в сервисе или middleware; rollback при исключении.

### 17. N+1 в async SQLAlchemy?

`selectinload` / `joinedload` в запросе. Симптом: 1 query + N для relations. Ловится логированием SQL или APM.

### 18. Транзакции в FastAPI?

`async with session.begin():` в сервисе. Не размазывать commit по роутерам. Для nested — savepoint.

### 19. Cache-aside в двух словах?

Read: cache → miss → DB → set cache. Write: DB → invalidate cache. TTL + jitter ([redis-basic/06](../redis-basic/06-patterns-cache.md)).

### 20. Redis упал — что с API?

Degrade: читать DB, отключить rate limit или in-memory fallback. Health `/ready` — redis optional vs required — решение продукта.

---

## Тестирование и качество

### 21. TestClient vs httpx AsyncClient?

TestClient — sync wrapper, удобен для простых тестов. AsyncClient + ASGITransport — **правильно** для async app и async DB ([30-testing](30-testing.md)).

### 22. Как мокать Depends?

`app.dependency_overrides[get_db] = lambda: fake_session` в fixture; `clear()` после теста.

### 23. Contract testing?

OpenAPI как контракт; Schemathesis ищет 5xx и schema mismatch ([32-contract-tests](32-contract-tests.md)).

### 24. Что тестировать в первую очередь?

Integration: auth, CRUD happy path, 401/403/422. Unit: чистая бизнес-логика. E2E: smoke на staging.

### 25. Фикстуры pytest scope?

`session` — дорогой app once; `function` — изоляция DB rollback. Не shared mutable state.

---

## Production и DevOps

### 26. uvicorn vs gunicorn+uvicorn workers?

uvicorn — один процесс. gunicorn master + UvicornWorker — несколько процессов на CPU. В K8s часто **N replicas × 1 uvicorn** ([33-docker-production](33-docker-production.md)).

### 27. Graceful shutdown?

SIGTERM → stop accept → finish requests → lifespan shutdown (close pools). `terminationGracePeriodSeconds` > timeout.

### 28. Liveness vs readiness?

Liveness — restart if dead; readiness — traffic only if DB/Redis OK ([kuber-intermediate/13-probes-advanced](../kuber-intermediate/13-probes-advanced.md)).

### 29. Где хранить секреты?

Env из K8s Secret / Vault; не в image. GitLab masked variables для CI.

### 30. Multi-stage Docker зачем?

Меньший образ, без compiler в runtime, меньше CVE surface.

---

## Observability и design

### 31. Метод RED?

Rate, Errors, Duration — минимум HTTP метрик ([36-observability](36-observability.md)).

### 32. Зачем trace_id в логах?

Связать лог строки с Jaeger trace ([38-opentelemetry](38-opentelemetry.md)).

### 33. Стратегии API versioning?

URL `/api/v1` — простейшая; header/Accept — гибче для cache ([39-versioning-idempotency](39-versioning-idempotency.md)).

### 34. Idempotency-Key когда обязателен?

POST с side effects (платёж, заказ) — защита от retry дублей.

### 35. Как спроектировать 10k RPS read API?

CDN + Redis cache + PG replicas + horizontal pods + PgBouncer ([40-system-design](40-system-design.md)).

---

## Поведенческие и углублённые

### 36. Lifespan vs `@app.on_event`?

`lifespan` context manager — рекомендуемый способ startup/shutdown в современном FastAPI; on_event deprecated.

### 37. BackgroundTasks ограничения?

Выполняются **после** ответа в том же процессе; не переживают restart; для надёжности — Celery/Kafka.

### 38. WebSocket в FastAPI?

`@app.websocket`; за nginx нужны Upgrade headers ([34-nginx-tls](34-nginx-tls.md)).

### 39. Как организовать большой проект?

Роутеры по доменам, `app/routers`, `services`, `schemas`, `deps` — [examples/project-layout.md](examples/project-layout.md).

### 40. Ваша слабость / сложный баг в API?

Шаблон STAR: симптом (5xx spike) → метрики RED → root cause (pool exhausted) → fix (PgBouncer + pool size) → postmortem. Привяжите к реальному опыту или лабе [37-lab-observability](37-lab-observability.md).

---

## Резюме

Повторяйте связки: **async + DI + Pydantic** в основе; **тесты + OpenAPI** для качества; **Docker + probes + RED** для prod. Практика: [42-capstone](42-capstone.md).

Следующий урок: [42-capstone](42-capstone.md).
