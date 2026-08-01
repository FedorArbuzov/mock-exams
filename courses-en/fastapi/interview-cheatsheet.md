# Interview cheatsheet — FastAPI

Tables for reviewing before an interview. Format: **question → short answer (~30s) → deep dive (2–3 min)**.

Full expanded answers: [41-interview-qa](41-interview-qa.md). Capstone for your portfolio: [42-capstone](42-capstone.md).

**Stacks:** [`deploy/fastapi`](../../deploy/fastapi/README.md) · [`deploy/nginx`](../../deploy/nginx/README.md) · [`deploy/observability`](../../deploy/observability/README.md)

**Related courses:** [observability-basic](../observability-basic/README.md) · [kuber-intermediate](../kuber-intermediate/README.md) · [gitlab-basic](../gitlab-basic/README.md)

---

## Basics

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 1 | FastAPI vs Flask? | ASGI + async + OpenAPI from types | Starlette, Pydantic; Flask is WSGI sync |
| 2 | ASGI? | Async server interface, WebSocket support | uvicorn/hypercorn vs gunicorn WSGI |
| 3 | Validation? | Pydantic → 422 before the handler runs | field_validator, Query/Path constraints |
| 4 | Depends()? | DI: db, user, settings | overrides in tests |
| 5 | async vs def route? | async = await I/O; def = threadpool | blocking call in an async route stalls the loop |

---

## Pydantic and the API

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 6 | response_model? | Filters fields + drives OpenAPI | exclude_unset, from_attributes for ORM |
| 7 | Pydantic v2? | Rust core, faster | model_validate, ConfigDict |
| 8 | Optional query? | `str \| None = None` | Query() vs required |
| 9 | Partial update? | Separate schema with optional fields | PATCH + exclude_unset |
| 10 | Business validation? | model_validator or a service | 400 vs 422 |

---

## Auth and security

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 11 | JWT flow? | login → Bearer → dependency decodes it | refresh, rotation, Vault secrets |
| 12 | OAuth2 scopes? | SecurityScopes in Depends | per-route security in OpenAPI |
| 13 | CORS? | Whitelist origins | credentials + no wildcard |
| 14 | 500 handling? | Generic client message, log the stack trace | request_id, Sentry |
| 15 | Rate limiting? | nginx at the edge + Redis in the app | 429, per-IP vs per-user |

---

## Data layer

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 16 | Session per request? | yield session in Depends | commit/rollback scope |
| 17 | N+1? | selectinload/joinedload | log the SQL, trace spans |
| 18 | Transactions? | async with session.begin() | savepoint, unit of work |
| 19 | Cache-aside? | GET cache → miss → DB → SET | TTL jitter, invalidate on write |
| 20 | Redis down? | Degrade to DB | health/ready semantics |

---

## Testing

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 21 | TestClient vs AsyncClient? | Sync vs native async | ASGITransport, asyncio_mode |
| 22 | Mock Depends? | dependency_overrides | clear it after the test |
| 23 | Contract tests? | OpenAPI + Schemathesis | catching breaking diffs in CI |
| 24 | Pyramid? | unit < integration < e2e | markers, nightly compose |
| 25 | Fixture scope? | function isolation by default | session-scoped app once |

---

## Production

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 26 | uvicorn vs gunicorn? | 1 process vs N UvicornWorkers | K8s replicas as an alternative |
| 27 | Graceful shutdown? | SIGTERM → drain → close pools | terminationGracePeriodSeconds |
| 28 | Liveness vs readiness? | restart vs traffic | /health vs /health/ready |
| 29 | Secrets? | K8s Secret, Vault, GitLab masked vars | never bake them into the image |
| 30 | Multi-stage Docker? | builder wheels, slim runtime | non-root, image scanning |

---

## Observability and design

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 31 | RED? | Rate, Errors, Duration | PromQL rate, histogram_quantile |
| 32 | trace_id in logs? | Correlating logs with Jaeger | OTel propagation |
| 33 | API versioning? | /api/v1 path is common | Sunset headers, OpenAPI diff |
| 34 | Idempotency-Key? | Same response on a repeated POST | Redis store 24h, 409 in-flight |
| 35 | 10k RPS? | Cache + replicas + pool + HPA | back-of-envelope bandwidth math |

---

## Advanced

| # | Question | Short answer | Deep dive |
|---|--------|----------------|-----------|
| 36 | lifespan? | async context startup/shutdown | replaces on_event |
| 37 | BackgroundTasks? | Runs after the response, same process | use a queue for reliability |
| 38 | WebSocket? | @app.websocket + nginx Upgrade | sticky sessions |
| 39 | Project structure? | routers/services/schemas/deps | [project-layout](examples/project-layout.md) |
| 40 | STAR bug story? | Metrics→hypothesis→fix→postmortem | pool exhaustion example |

---

## "Interview day" commands

```bash
# stack
cd deploy/fastapi && docker compose up -d && curl -s localhost:8090/health

# tests
cd stack/api && pytest -v --tb=short

# metrics
curl -s localhost:8090/metrics | head

# openapi
curl -s localhost:8090/openapi.json | jq .info
```

---

## Quick formulas

| Calculation | Formula |
|--------|---------|
| Egress | RPS × avg_response_bytes |
| DB conns | pods × pool_size → PgBouncer |
| Cache hit | hits / (hits + misses) |
| Error rate | 5xx_rate / total_rate |

---

## 30-minutes-before-the-interview checklist

- [ ] Explain async + DI on a whiteboard
- [ ] Draw cache-aside
- [ ] One pytest override example
- [ ] RED + one PromQL query
- [ ] JWT flow in 4 steps
- [ ] Idempotency for a payment POST

Good luck on the interview.
