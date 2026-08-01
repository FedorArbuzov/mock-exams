# Recommended FastAPI project structure

Aligned with the capstone [42-capstone](../42-capstone.md) and the [`deploy/fastapi`](../../../deploy/fastapi/README.md) stack. Scales from labs to production without a "god package."

---

## Directory tree

```text
task-manager/                    # repo root
├── app/
│   ├── __init__.py
│   ├── main.py                  # FastAPI app, lifespan, middleware
│   ├── core/
│   │   ├── config.py            # pydantic-settings BaseSettings
│   │   ├── security.py          # JWT, password hash
│   │   ├── redis.py             # Redis client factory
│   │   ├── telemetry.py         # OTel setup (optional)
│   │   └── logging.py           # structlog config
│   ├── db/
│   │   ├── base.py              # DeclarativeBase
│   │   ├── session.py           # async engine, sessionmaker
│   │   └── models/
│   │       ├── user.py
│   │       └── task.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── task.py
│   │   └── common.py            # ErrorOut, Pagination
│   ├── services/
│   │   ├── auth_service.py
│   │   └── task_service.py      # business logic, no HTTP
│   ├── deps.py                  # get_db, get_current_user, get_redis
│   └── routers/
│       ├── health.py
│       ├── auth.py
│       └── tasks.py
├── alembic/
│   ├── env.py
│   └── versions/
├── tests/
│   ├── conftest.py
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── deploy/
│   ├── Dockerfile
│   └── docker-compose.yml
├── alembic.ini
├── pyproject.toml
├── .env.example
└── .dockerignore
```

---

## Layer rules

```mermaid
flowchart TB
  routers[routers HTTP]
  services[services business]
  db[db models session]
  routers --> services
  services --> db
```

| Layer | Responsibility | Doesn't do |
|------|-----------------|-----------|
| **routers** | HTTP codes, Depends, thin | raw SQL |
| **services** | business rules, transactions | Starlette Request/Response |
| **schemas** | in/out validation | DB access |
| **models** | ORM mapping | business rules |

---

## main.py (skeleton)

```python
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.core.config import settings
from app.routers import auth, health, tasks

@asynccontextmanager
async def lifespan(app: FastAPI):
    # await init_db(), init_redis()
    yield
    # await close pools

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)
app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(tasks.router, prefix="/api/v1")
```

---

## config.py

```python
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")
    APP_NAME: str = "task-manager"
    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"
    JWT_SECRET: str
    JWT_TTL_MINUTES: int = 60

settings = Settings()
```

Secrets: [gitlab-basic/07-variables-secrets](../../gitlab-basic/07-variables-secrets.md).

---

## deps.py

```python
from fastapi import Depends
from app.db.session import get_session
from app.core.redis import get_redis

# Re-export for a single import point in routers
__all__ = ["get_session", "get_redis", "get_current_user"]
```

---

## Tests

| Directory | Contents |
|---------|------------|
| `tests/unit/` | schemas, pure functions |
| `tests/integration/` | routers + fake db/redis |
| `tests/e2e/` | smoke tests against compose |

`conftest.py` — `AsyncClient`, `app`, overrides. See [30-testing](../30-testing.md).

---

## Deploy

For the course you can keep the code in [`deploy/fastapi/stack/api`](../../../deploy/fastapi/stack/api) — then `app/` lives inside `stack/api/`. For the capstone — use a separate repository with `deploy/` at the root.

| File | Purpose |
|------|------------|
| `Dockerfile` | multi-stage, non-root |
| `docker-compose.yml` | api + postgres + redis |
| `.dockerignore` | tests, .git, __pycache__ |

[33-docker-production](../33-docker-production.md).

---

## Anti-patterns

| Anti-pattern | Problem |
|-------------|----------|
| Everything in `main.py` | untestable |
| ORM models as response_model | field leakage |
| Global sync session | race conditions under async |
| `routers/` calls Redis directly without a service | duplication |

---

## Extensions (later)

```text
app/workers/          # Celery / arq consumers
app/integrations/     # external HTTP clients
kubernetes/           # manifests for kuber-intermediate
.gitlab-ci.yml        # gitlab-basic pipeline
```

---

## Related material

- Dependencies: [pyproject.toml](pyproject.toml)
- Observability hooks: [36-observability](../36-observability.md)
- nginx front: [35-lab-nginx](../35-lab-nginx.md)
