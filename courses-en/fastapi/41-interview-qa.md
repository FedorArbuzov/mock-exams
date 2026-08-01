# 41. FastAPI: 40 interview questions

Detailed answers to prepare for backend/Python interviews. Short version: [interview-cheatsheet](interview-cheatsheet.md).

**Environments:** [`deploy/fastapi`](../../deploy/fastapi/README.md) · [`deploy/nginx`](../../deploy/nginx/README.md) · [`deploy/observability`](../../deploy/observability/README.md)

---

## Basics and architecture

### 1. How does FastAPI differ from Flask/Django REST?

FastAPI is built on **Starlette** (ASGI) and **Pydantic** (validation). Native **async/await**, automatic **OpenAPI** generation, type hints as a contract. Flask is WSGI, sync-first; Django REST is a full framework with an ORM and admin. FastAPI is chosen for **I/O-bound APIs** with high performance and strict schemas.

### 2. What is ASGI and why does FastAPI need it?

ASGI is the asynchronous interface between the server (uvicorn, hypercorn) and the application. It supports WebSocket, long-lived connections, and concurrent I/O without blocking the thread. WSGI is one request per worker in a sync model.

### 3. How does FastAPI validate input data?

Through **Pydantic models** (or `Annotated` + validators) in function parameters: path, query, body, headers. Errors → **422 Unprocessable Entity** with detailed JSON. Validation before entering the handler — less boilerplate than manual `if` checks.

### 4. What is dependency injection in FastAPI?

Functions in `Depends()` are resolved before the handler: DB session, current user, settings. They are overridden in tests via `app.dependency_overrides`. This is a composition root — not global singletons.

### 5. `def` vs `async def` in routers?

`async def` — don't block the event loop; await for DB/HTTP. `def` — FastAPI runs it in a **threadpool** (suitable for CPU-bound or sync ORM). Mixing: an async route + a sync blocking call without await **blocks** the entire loop.

---

## Pydantic and schemas

### 6. Why `response_model` if you already return a dict?

Field filtering (don't leak the password), serialization, **OpenAPI documentation**, response validation in dev. `response_model_exclude_unset` — only the fields that were set.

### 7. Difference between Pydantic v1 and v2?

v2 is on **pydantic-core** (Rust) — faster, `model_validate`, `ConfigDict` instead of `class Config`. FastAPI 0.100+ targets v2. Migration: `from_attributes=True` for ORM.

### 8. How to describe optional and default in a query?

`q: str | None = None` or `Query(default=None, max_length=50)`. Distinction: optional vs required with a default — affects OpenAPI `required`.

### 9. Nested models and lists?

`items: list[ItemCreate]`, nesting via model fields. For partial update — a separate `ItemUpdate` with optional fields or `model_dump(exclude_unset=True)`.

### 10. How to validate at the business-rules level?

`@field_validator`, `@model_validator` in Pydantic v2, or `HTTPException(400)` in the service layer after a DB check (email uniqueness).

---

## Auth and security

### 11. How to implement JWT auth?

`OAuth2PasswordBearer` + dependency: decode the JWT, load the user. Access short TTL, refresh token separately. The secret is not in the code — env/Vault ([gitlab-basic/07](../gitlab-basic/07-variables-secrets.md)).

### 12. OAuth2 scopes in FastAPI?

`SecurityScopes` in a dependency, check `scope in token.scopes`. OpenAPI shows the required scopes per endpoint.

### 13. CORS — what to configure?

`CORSMiddleware`: `allow_origins` — a whitelist, not `*` with credentials. `allow_methods`, `allow_headers`. The middleware handles preflight OPTIONS.

### 14. How to avoid leaking a stack trace to the client?

A global `exception_handler` → 500 + a generic message; details go to the log with `request_id`. In dev — `debug=True` or a separate handler.

### 15. Rate limiting — where is it best?

**Edge** (nginx) — DDoS; **app** (Redis) — per-user/API key; both levels are compatible ([29-lab-redis](29-lab-redis.md), [34-nginx-tls](34-nginx-tls.md)).

---

## Database and Redis

### 16. The session-per-request pattern?

```python
async def get_db():
    async with session_factory() as session:
        yield session
```

One session per request; commit in the service or middleware; rollback on exception.

### 17. N+1 in async SQLAlchemy?

`selectinload` / `joinedload` in the query. Symptom: 1 query + N for relations. Caught by SQL logging or APM.

### 18. Transactions in FastAPI?

`async with session.begin():` in the service. Don't spread commits across routers. For nested — savepoint.

### 19. Cache-aside in a nutshell?

Read: cache → miss → DB → set cache. Write: DB → invalidate cache. TTL + jitter ([redis-basic/06](../redis-basic/06-patterns-cache.md)).

### 20. Redis is down — what about the API?

Degrade: read from the DB, disable rate limiting or use an in-memory fallback. Health `/ready` — redis optional vs required — a product decision.

---

## Testing and quality

### 21. TestClient vs httpx AsyncClient?

TestClient — a sync wrapper, convenient for simple tests. AsyncClient + ASGITransport — the **correct** choice for an async app and async DB ([30-testing](30-testing.md)).

### 22. How to mock Depends?

`app.dependency_overrides[get_db] = lambda: fake_session` in a fixture; `clear()` after the test.

### 23. Contract testing?

OpenAPI as a contract; Schemathesis looks for 5xx and schema mismatch ([32-contract-tests](32-contract-tests.md)).

### 24. What to test first?

Integration: auth, CRUD happy path, 401/403/422. Unit: pure business logic. E2E: smoke on staging.

### 25. pytest fixture scope?

`session` — the expensive app once; `function` — DB rollback isolation. No shared mutable state.

---

## Production and DevOps

### 26. uvicorn vs gunicorn+uvicorn workers?

uvicorn — a single process. gunicorn master + UvicornWorker — several processes per CPU. In K8s it's often **N replicas × 1 uvicorn** ([33-docker-production](33-docker-production.md)).

### 27. Graceful shutdown?

SIGTERM → stop accept → finish requests → lifespan shutdown (close pools). `terminationGracePeriodSeconds` > timeout.

### 28. Liveness vs readiness?

Liveness — restart if dead; readiness — traffic only if DB/Redis OK ([kuber-intermediate/13-probes-advanced](../kuber-intermediate/13-probes-advanced.md)).

### 29. Where to store secrets?

Env from a K8s Secret / Vault; not in the image. GitLab masked variables for CI.

### 30. Why multi-stage Docker?

A smaller image, no compiler in runtime, less CVE surface.

---

## Observability and design

### 31. The RED method?

Rate, Errors, Duration — the minimum HTTP metrics ([36-observability](36-observability.md)).

### 32. Why trace_id in logs?

To link log lines with a Jaeger trace ([38-opentelemetry](38-opentelemetry.md)).

### 33. API versioning strategies?

URL `/api/v1` — the simplest; header/Accept — more flexible for cache ([39-versioning-idempotency](39-versioning-idempotency.md)).

### 34. When is Idempotency-Key required?

POST with side effects (payment, order) — protection against retry duplicates.

### 35. How to design a 10k RPS read API?

CDN + Redis cache + PG replicas + horizontal pods + PgBouncer ([40-system-design](40-system-design.md)).

---

## Behavioral and advanced

### 36. Lifespan vs `@app.on_event`?

`lifespan` context manager — the recommended way to do startup/shutdown in modern FastAPI; on_event is deprecated.

### 37. BackgroundTasks limitations?

They run **after** the response in the same process; they don't survive a restart; for reliability — Celery/Kafka.

### 38. WebSocket in FastAPI?

`@app.websocket`; behind nginx you need Upgrade headers ([34-nginx-tls](34-nginx-tls.md)).

### 39. How to organize a large project?

Routers by domain, `app/routers`, `services`, `schemas`, `deps` — [examples/project-layout.md](examples/project-layout.md).

### 40. Your weakness / a hard bug in an API?

STAR template: symptom (5xx spike) → RED metrics → root cause (pool exhausted) → fix (PgBouncer + pool size) → postmortem. Tie it to real experience or the lab [37-lab-observability](37-lab-observability.md).

---

## Summary

Rehearse the combinations: **async + DI + Pydantic** at the core; **tests + OpenAPI** for quality; **Docker + probes + RED** for prod. Practice: [42-capstone](42-capstone.md).

Next lesson: [42-capstone](42-capstone.md).
