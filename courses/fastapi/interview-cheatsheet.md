# Interview cheatsheet — FastAPI

Таблицы для повторения перед собеседованием. Формат: **вопрос → короткий ответ (≈30 с) → deep dive (2–3 мин)**.

Полные развёрнутые ответы: [41-interview-qa](41-interview-qa.md). Capstone для портфолио: [42-capstone](42-capstone.md).

**Стенды:** [`deploy/fastapi`](../../deploy/fastapi/README.md) · [`deploy/nginx`](../../deploy/nginx/README.md) · [`deploy/observability`](../../deploy/observability/README.md)

**Связанные курсы:** [observability-basic](../observability-basic/README.md) · [kuber-intermediate](../kuber-intermediate/README.md) · [gitlab-basic](../gitlab-basic/README.md)

---

## Основы

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 1 | FastAPI vs Flask? | ASGI + async + OpenAPI из типов | Starlette, Pydantic; Flask WSGI sync |
| 2 | ASGI? | Async server interface, WebSocket | uvicorn/hypercorn vs gunicorn WSGI |
| 3 | Валидация? | Pydantic → 422 до handler | field_validator, Query/Path constraints |
| 4 | Depends()? | DI: db, user, settings | overrides в тестах |
| 5 | async vs def route? | async=await I/O; def=threadpool | blocking в async route = stall loop |

---

## Pydantic и API

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 6 | response_model? | Фильтр полей + OpenAPI | exclude_unset, from_attributes ORM |
| 7 | Pydantic v2? | Rust core, быстрее | model_validate, ConfigDict |
| 8 | Optional query? | `str \| None = None` | Query() vs required |
| 9 | Partial update? | Отдельная схема optional fields | PATCH + exclude_unset |
| 10 | Бизнес-валидация? | model_validator или сервис | 400 vs 422 |

---

## Auth и security

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 11 | JWT flow? | login → Bearer → dependency decode | refresh, rotation, Vault secrets |
| 12 | OAuth2 scopes? | SecurityScopes в Depends | OpenAPI security per route |
| 13 | CORS? | Whitelist origins | credentials + no wildcard |
| 14 | 500 handling? | Generic client msg, log stack | request_id, Sentry |
| 15 | Rate limit? | nginx edge + Redis app | 429, per-IP vs per-user |

---

## Data layer

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 16 | Session per request? | yield session in Depends | commit/rollback scope |
| 17 | N+1? | selectinload/joinedload | лог SQL, trace spans |
| 18 | Транзакции? | async with session.begin() | savepoint, unit of work |
| 19 | Cache-aside? | GET cache → miss DB → SET | TTL jitter, invalidate on write |
| 20 | Redis down? | Degrade to DB | health ready semantics |

---

## Testing

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 21 | TestClient vs AsyncClient? | Sync vs native async | ASGITransport, asyncio_mode |
| 22 | Mock Depends? | dependency_overrides | clear after test |
| 23 | Contract tests? | OpenAPI + Schemathesis | breaking diff in CI |
| 24 | Пирамида? | unit < integration < e2e | markers, nightly compose |
| 25 | Fixture scope? | function isolation default | session app once |

---

## Production

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 26 | uvicorn vs gunicorn? | 1 proc vs N UvicornWorker | K8s replicas alternative |
| 27 | Graceful shutdown? | SIGTERM → drain → close pools | terminationGracePeriodSeconds |
| 28 | Liveness vs readiness? | restart vs traffic | /health vs /health/ready |
| 29 | Секреты? | K8s Secret, Vault, GitLab masked | never in image |
| 30 | Multi-stage Docker? | builder wheels, slim runtime | non-root, scan |

---

## Observability и design

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 31 | RED? | Rate, Errors, Duration | PromQL rate, histogram_quantile |
| 32 | trace_id в логах? | Корреляция log↔Jaeger | OTel propagation |
| 33 | API versioning? | /api/v1 path common | Sunset headers, OpenAPI diff |
| 34 | Idempotency-Key? | Same response on POST retry | Redis store 24h, 409 in-flight |
| 35 | 10k RPS? | Cache + replicas + pool + HPA | back-of-envelope bandwidth |

---

## Advanced

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 36 | lifespan? | async context startup/shutdown | replaces on_event |
| 37 | BackgroundTasks? | After response same process | queue for reliability |
| 38 | WebSocket? | @app.websocket + nginx Upgrade | sticky sessions |
| 39 | Структура проекта? | routers/services/schemas/deps | [project-layout](examples/project-layout.md) |
| 40 | STAR bug story? | Metrics→hypothesis→fix→postmortem | pool exhaust пример |

---

## Команды «день собеседования»

```bash
# стенд
cd deploy/fastapi && docker compose up -d && curl -s localhost:8090/health

# тесты
cd stack/api && pytest -v --tb=short

# метрики
curl -s localhost:8090/metrics | head

# openapi
curl -s localhost:8090/openapi.json | jq .info
```

---

## Быстрые формулы

| Расчёт | Формула |
|--------|---------|
| Egress | RPS × avg_response_bytes |
| DB conns | pods × pool_size → PgBouncer |
| Cache hit | hits / (hits + misses) |
| Error rate | 5xx_rate / total_rate |

---

## Чек-лист за 30 минут до интервью

- [ ] Объяснить async + DI на доске
- [ ] Нарисовать cache-aside
- [ ] Один пример pytest override
- [ ] RED + один PromQL
- [ ] JWT flow 4 шага
- [ ] Idempotency POST payment

Удачи на собеседовании.
