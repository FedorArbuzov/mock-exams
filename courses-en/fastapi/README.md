# FastAPI — Complete Course

A deeply detailed course for **backend / fullstack / DevOps engineers**: from the **Python web landscape** to a **production API** — Pydantic v2, DI, layered architecture, **async SQLAlchemy 2.0**, JWT, Redis, WebSockets, tests, observability, Docker, and nginx. **42 lessons** + a capstone + an interview cheatsheet.

**Prerequisites:** terminal and Linux basics ([`linux-basic`](../linux-basic/README.md)). HTTP and reverse proxies — [`nginx-basic`](../nginx-basic/README.md). SQL — [`postgresql-basic`](../postgresql-basic/README.md) (chapters 03–06). Containers — [`containers-basic`](../containers-basic/README.md).

**Locally:** [`deploy/fastapi`](../../deploy/fastapi/README.md) — `docker compose up -d --build`:

| Service | URL / port |
|--------|------------|
| API | [http://localhost:8090](http://localhost:8090) |
| OpenAPI (Swagger) | [http://localhost:8090/docs](http://localhost:8090/docs) |
| ReDoc | [http://localhost:8090/redoc](http://localhost:8090/redoc) |
| Health | [http://localhost:8090/health](http://localhost:8090/health) |
| Metrics | [http://localhost:8090/metrics](http://localhost:8090/metrics) |
| Items API | [http://localhost:8090/api/v1/items](http://localhost:8090/api/v1/items) |

PostgreSQL and Redis run **inside** the compose stack. For direct `psql` access — [`deploy/postgres`](../../deploy/postgres/README.md). For Redis cluster/Sentinel — [`deploy/redis`](../../deploy/redis/README.md).

Smoke test: `bash scripts/smoke.sh` in `deploy/fastapi`.

## How to read the chapters

Each lesson is a **chapter of a book**, not a cheat sheet.

1. **Theory** (01, 02, 04…) — a real-world scenario → concepts → code → common mistakes.
2. **Lab** (03, 06…) — the `deploy/fastapi` stack or a local venv.
3. After block 39–41 — [`interview-cheatsheet.md`](interview-cheatsheet.md), no peeking.
4. [42-capstone.md](42-capstone.md) — **6–8 hours**, the final project.

**Time:** ~**50–70 minutes** per "theory + lab" pair; the whole course — **~40–55 hours**.

## Syllabus (42 lessons)

### Phase 1. Landscape and first API (01–06)

| # | Lesson |
|---|------|
| 01 | [Landscape: Flask, Django, Starlette, FastAPI, ASGI](01-landscape.md) |
| 02 | [First application: uvicorn, OpenAPI](02-first-app.md) |
| 03 | [Lab: first application](03-lab-first-app.md) |
| 04 | [Pydantic v2: BaseModel, Field, validators](04-pydantic-v2.md) |
| 05 | [Parameters: Path, Query, Body, Header, Cookie](05-parameters.md) |
| 06 | [Lab: in-memory CRUD](06-lab-crud.md) |

### Phase 2. Application architecture (07–12)

| 07 | [Dependency Injection: Depends, scopes, yield](07-dependency-injection.md) |
| 08 | [Project structure: APIRouter, layers](08-project-structure.md) |
| 09 | [Lab: modular application](09-lab-modular-app.md) |
| 10 | [Settings: pydantic-settings, env](10-settings.md) |
| 11 | [Errors and response_model](11-errors-response-model.md) |
| 12 | [Lab: error handling](12-lab-error-handling.md) |

### Phase 3. Database (13–18)

| 13 | [SQLAlchemy 2.0 async](13-sqlalchemy-async.md) |
| 14 | [Sessions, repositories, transactions](14-sessions-repos.md) |
| 15 | [Alembic: schema migrations](15-alembic.md) |
| 16 | [Lab: PostgreSQL CRUD](16-lab-postgres.md) |
| 17 | [Pagination, filters, sorting](17-pagination-filters.md) |
| 18 | [Lab: a filtered list](18-lab-pagination.md) |

### Phase 4. Authentication and security (19–22)

| 19 | [OAuth2 Password + JWT](19-oauth2-jwt.md) |
| 20 | [RBAC, scopes, refresh tokens](20-rbac-scopes.md) |
| 21 | [Lab: login and protected routes](21-lab-auth.md) |
| 22 | [API security checklist](22-security-checklist.md) |

### Phase 5. Middleware and realtime (23–26)

| 23 | [Middleware, CORS, GZip](23-middleware-cors.md) |
| 24 | [Lifespan, background tasks](24-lifespan-background.md) |
| 25 | [WebSockets and SSE](25-websockets-sse.md) |
| 26 | [Lab: realtime + background jobs](26-lab-realtime.md) |

### Phase 6. Async and Redis (27–29)

| 27 | [Async patterns and connection pools](27-async-patterns.md) |
| 28 | [Redis: cache-aside, rate limiting](28-redis-cache.md) |
| 29 | [Lab: cache and rate limiting](29-lab-redis.md) |

### Phase 7. Testing (30–32)

| 30 | [pytest, TestClient, fixtures](30-testing.md) |
| 31 | [Lab: covering the API with tests](31-lab-testing.md) |
| 32 | [Contract tests and OpenAPI](32-contract-tests.md) |

### Phase 8. Production deployment (33–35)

| 33 | [Docker, Gunicorn, graceful shutdown](33-docker-production.md) |
| 34 | [nginx, TLS, health probes](34-nginx-tls.md) |
| 35 | [Lab: deploying behind nginx](35-lab-nginx.md) |

### Phase 9. Observability (36–38)

| 36 | [Metrics, logs, traces](36-observability.md) |
| 37 | [Lab: Prometheus + structured logs](37-lab-observability.md) |
| 38 | [OpenTelemetry in FastAPI](38-opentelemetry.md) |

### Phase 10. Senior level (39–42)

| 39 | [API versioning, idempotency](39-versioning-idempotency.md) |
| 40 | [System design: a REST API under load](40-system-design.md) |
| 41 | [Interview Q&A (top 40)](41-interview-qa.md) |
| 42 | [Capstone: Task Manager API](42-capstone.md) |

### Cheatsheets and examples

| — | [Interview cheatsheet](interview-cheatsheet.md) |
| — | [examples/project-layout.md](examples/project-layout.md) |
| — | [examples/pyproject.toml](examples/pyproject.toml) |

## What you should come away with

- You can explain **why FastAPI** on ASGI, not "just another Flask."
- You write **typed** endpoints with **Pydantic v2** and auto-generated OpenAPI.
- You build a **modular** application: routers, services, repositories, settings.
- You work with **async SQLAlchemy 2.0**, transactions, and Alembic migrations.
- You implement **JWT auth**, RBAC, and secure headers.
- You cache with **Redis** and use **WebSockets/SSE**.
- You cover the API with **pytest + httpx** and set up **metrics and traces**.
- You package the app in **Docker** and put it behind **nginx**.
- You can answer **system design** and **interview Q&A** questions.

## Relation to other courses

| Course | Connection |
|------|-------|
| [`postgresql-basic`](../postgresql-basic/README.md) | SQL, indexes, transactions |
| [`postgresql-developer`](../postgresql-developer/README.md) | migrations, N+1, JSONB |
| [`redis-basic`](../redis-basic/README.md) | cache, TTL, pub/sub |
| [`containers-basic`](../containers-basic/README.md) | Dockerfile, compose |
| [`nginx-basic`](../nginx-basic/README.md) | upstream, proxy_pass |
| [`nginx-intermediate`](../nginx-intermediate/README.md) | TLS, rate limiting |
| [`observability-basic`](../observability-basic/README.md) | Prometheus, RED |
| [`gitlab-basic`](../gitlab-basic/README.md) | CI pipeline for Python |
| [`kuber-intermediate`](../kuber-intermediate/README.md) | probes, HPA |
| [`appsec-fundamentals`](../appsec-fundamentals/README.md) | OWASP API Top 10 |

## Examples

| Path | Purpose |
|------|--------|
| [`deploy/fastapi/stack/api`](../../deploy/fastapi/stack/api) | the course's reference stack |
| [`deploy/fastapi/init/01-schema.sql`](../../deploy/fastapi/init/01-schema.sql) | `users` / `items` schema |
