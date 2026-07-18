# FastAPI — полный курс

Мега-подробный курс для **backend / fullstack / DevOps**: от **ландшафта Python web** до **production API** — Pydantic v2, DI, слоистая архитектура, **async SQLAlchemy 2.0**, JWT, Redis, WebSockets, тесты, observability, Docker и nginx. **42 урока** + capstone + interview cheatsheet.

**Предварительно:** терминал и основы Linux ([`linux-basic`](../linux-basic/README.md)). HTTP и reverse proxy — [`nginx-basic`](../nginx-basic/README.md). SQL — [`postgresql-basic`](../postgresql-basic/README.md) (главы 03–06). Контейнеры — [`containers-basic`](../containers-basic/README.md).

**Локально:** [`deploy/fastapi`](../../deploy/fastapi/README.md) — `docker compose up -d --build`:

| Сервис | URL / порт |
|--------|------------|
| API | [http://localhost:8090](http://localhost:8090) |
| OpenAPI (Swagger) | [http://localhost:8090/docs](http://localhost:8090/docs) |
| ReDoc | [http://localhost:8090/redoc](http://localhost:8090/redoc) |
| Health | [http://localhost:8090/health](http://localhost:8090/health) |
| Metrics | [http://localhost:8090/metrics](http://localhost:8090/metrics) |
| Items API | [http://localhost:8090/api/v1/items](http://localhost:8090/api/v1/items) |

PostgreSQL и Redis **внутри** compose. Для прямого `psql` — [`deploy/postgres`](../../deploy/postgres/README.md). Для Redis cluster/Sentinel — [`deploy/redis`](../../deploy/redis/README.md).

Smoke: `bash scripts/smoke.sh` в `deploy/fastapi`.

## Как читать главы

Каждый урок — **глава книги**, не шпаргалка.

1. **Теория** (01, 02, 04…) — сценарий с работы → концепции → код → типичные ошибки.
2. **Лаба** (03, 06…) — стенд `deploy/fastapi` или локальный venv.
3. После блока 39–41 — [`interview-cheatsheet.md`](interview-cheatsheet.md) без подглядывания.
4. [42-capstone.md](42-capstone.md) — **6–8 часов**, финальный проект.

**Время:** ~**50–70 минут** на пару «теория + лаба»; весь курс — **~40–55 часов**.

## Программа (42 урока)

### Фаза 1. Ландшафт и первый API (01–06)

| # | Урок |
|---|------|
| 01 | [Ландшафт: Flask, Django, Starlette, FastAPI, ASGI](01-landscape.md) |
| 02 | [Первое приложение: uvicorn, OpenAPI](02-first-app.md) |
| 03 | [Лаба: первое приложение](03-lab-first-app.md) |
| 04 | [Pydantic v2: BaseModel, Field, validators](04-pydantic-v2.md) |
| 05 | [Параметры: Path, Query, Body, Header, Cookie](05-parameters.md) |
| 06 | [Лаба: CRUD в памяти](06-lab-crud.md) |

### Фаза 2. Архитектура приложения (07–12)

| 07 | [Dependency Injection: Depends, scopes, yield](07-dependency-injection.md) |
| 08 | [Структура проекта: APIRouter, слои](08-project-structure.md) |
| 09 | [Лаба: модульное приложение](09-lab-modular-app.md) |
| 10 | [Настройки: pydantic-settings, env](10-settings.md) |
| 11 | [Ошибки и response_model](11-errors-response-model.md) |
| 12 | [Лаба: обработка ошибок](12-lab-error-handling.md) |

### Фаза 3. База данных (13–18)

| 13 | [SQLAlchemy 2.0 async](13-sqlalchemy-async.md) |
| 14 | [Сессии, репозитории, транзакции](14-sessions-repos.md) |
| 15 | [Alembic: миграции схемы](15-alembic.md) |
| 16 | [Лаба: PostgreSQL CRUD](16-lab-postgres.md) |
| 17 | [Пагинация, фильтры, сортировка](17-pagination-filters.md) |
| 18 | [Лаба: список с фильтрами](18-lab-pagination.md) |

### Фаза 4. Аутентификация и безопасность (19–22)

| 19 | [OAuth2 Password + JWT](19-oauth2-jwt.md) |
| 20 | [RBAC, scopes, refresh tokens](20-rbac-scopes.md) |
| 21 | [Лаба: login и защищённые роуты](21-lab-auth.md) |
| 22 | [Security checklist API](22-security-checklist.md) |

### Фаза 5. Middleware и realtime (23–26)

| 23 | [Middleware, CORS, GZip](23-middleware-cors.md) |
| 24 | [Lifespan, background tasks](24-lifespan-background.md) |
| 25 | [WebSockets и SSE](25-websockets-sse.md) |
| 26 | [Лаба: realtime + фоновые задачи](26-lab-realtime.md) |

### Фаза 6. Async и Redis (27–29)

| 27 | [Async patterns и connection pools](27-async-patterns.md) |
| 28 | [Redis: cache-aside, rate limit](28-redis-cache.md) |
| 29 | [Лаба: кэш и rate limit](29-lab-redis.md) |

### Фаза 7. Тестирование (30–32)

| 30 | [pytest, TestClient, фикстуры](30-testing.md) |
| 31 | [Лаба: покрытие API тестами](31-lab-testing.md) |
| 32 | [Contract tests и OpenAPI](32-contract-tests.md) |

### Фаза 8. Production deploy (33–35)

| 33 | [Docker, Gunicorn, graceful shutdown](33-docker-production.md) |
| 34 | [nginx, TLS, health probes](34-nginx-tls.md) |
| 35 | [Лаба: deploy за nginx](35-lab-nginx.md) |

### Фаза 9. Observability (36–38)

| 36 | [Метрики, логи, трейсы](36-observability.md) |
| 37 | [Лаба: Prometheus + structured logs](37-lab-observability.md) |
| 38 | [OpenTelemetry в FastAPI](38-opentelemetry.md) |

### Фаза 10. Senior (39–42)

| 39 | [Версионирование API, идемпотентность](39-versioning-idempotency.md) |
| 40 | [System design: REST API под нагрузкой](40-system-design.md) |
| 41 | [Interview Q&A (топ-40)](41-interview-qa.md) |
| 42 | [Capstone: Task Manager API](42-capstone.md) |

### Шпаргалки и примеры

| — | [Interview cheatsheet](interview-cheatsheet.md) |
| — | [examples/project-layout.md](examples/project-layout.md) |
| — | [examples/pyproject.toml](examples/pyproject.toml) |

## Что должно получиться

- Объясняете **почему FastAPI** на ASGI, а не «ещё один Flask».
- Пишете **типизированные** эндпоинты с **Pydantic v2** и автогенерацией OpenAPI.
- Строите **модульное** приложение: routers, services, repositories, settings.
- Работаете с **async SQLAlchemy 2.0**, транзакциями и миграциями Alembic.
- Реализуете **JWT auth**, RBAC и безопасные заголовки.
- Кэшируете через **Redis**, используете **WebSockets/SSE**.
- Покрываете API **pytest + httpx**, настраиваете **метрики и трейсы**.
- Упаковываете в **Docker** и ставите за **nginx**.
- Отвечаете на **system design** и **interview Q&A**.

## Связь с другими курсами

| Курс | Связь |
|------|-------|
| [`postgresql-basic`](../postgresql-basic/README.md) | SQL, индексы, транзакции |
| [`postgresql-developer`](../postgresql-developer/README.md) | миграции, N+1, JSONB |
| [`redis-basic`](../redis-basic/README.md) | кэш, TTL, pub/sub |
| [`containers-basic`](../containers-basic/README.md) | Dockerfile, compose |
| [`nginx-basic`](../nginx-basic/README.md) | upstream, proxy_pass |
| [`nginx-intermediate`](../nginx-intermediate/README.md) | TLS, rate limit |
| [`observability-basic`](../observability-basic/README.md) | Prometheus, RED |
| [`gitlab-basic`](../gitlab-basic/README.md) | CI pipeline для Python |
| [`kuber-intermediate`](../kuber-intermediate/README.md) | probes, HPA |
| [`appsec-fundamentals`](../appsec-fundamentals/README.md) | OWASP API Top 10 |

## Примеры

| Путь | Назначение |
|------|------------|
| [`deploy/fastapi/stack/api`](../../deploy/fastapi/stack/api) | эталонный стек курса |
| [`deploy/fastapi/init/01-schema.sql`](../../deploy/fastapi/init/01-schema.sql) | схема `users` / `items` |
