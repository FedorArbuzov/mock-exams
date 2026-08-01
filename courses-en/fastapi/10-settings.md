# 10. Settings: pydantic-settings, env

## Intro: "in prod, the API is knocking on localhost"

A developer hardcoded `DATABASE_URL = "postgresql://course:course@localhost:5432/course"`. In Docker Compose, Postgres lives at the host `postgres`, not `localhost`. The deploy fails, and the logs show connection refused. **Configuration through the environment** is a mandatory layer; **pydantic-settings** gives you types, validation, and a `.env` file for local development.

## What you'll learn

- **BaseSettings** and its sources: env, `.env`, secrets.
- Splitting **dev/staging/prod** without branching in code.
- How settings connect to **lifespan** and `Depends`.
- Secrets and the 12-factor app.

## BaseSettings

```python
# app/core/config.py
from pydantic import Field, PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "Orders API"
    DEBUG: bool = False
    API_PREFIX: str = "/api/v1"

    DATABASE_URL: PostgresDsn
    REDIS_URL: RedisDsn = "redis://redis:6379/0"

    JWT_SECRET: str = Field(min_length=32)
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

settings = Settings()
```

```bash
# .env.example (commit this to git)
DATABASE_URL=postgresql+asyncpg://course:course@postgres:5432/course
REDIS_URL=redis://redis:6379/0
JWT_SECRET=change-me-to-32-chars-minimum-secret
DEBUG=true
```

**`.env`** goes in `.gitignore`; only `.env.example` belongs in the repo.

## Using it in the app

```python
from app.core.config import settings

app = FastAPI(title=settings.APP_NAME, debug=settings.DEBUG)
```

```python
from functools import lru_cache
from fastapi import Depends

@lru_cache
def get_settings() -> Settings:
    return Settings()

@app.get("/info")
async def info(cfg: Settings = Depends(get_settings)):
    return {"app": cfg.APP_NAME, "debug": cfg.DEBUG}
```

`@lru_cache` keeps a single instance per process; for tests, use `dependency_overrides` or set `os.environ` and clear the cache.

## Lifespan and settings

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    cfg = get_settings()
    app.state.engine = create_async_engine(str(cfg.DATABASE_URL))
    yield
    await app.state.engine.dispose()
```

The course stand's compose file passes env vars into the api container — see [`deploy/fastapi/docker-compose.yml`](../../deploy/fastapi/docker-compose.yml).

## Source priority table

| Source | Priority | When |
|--------|----------|------|
| Environment variables | highest | prod, k8s Secret |
| `.env` file | below env | local development |
| Class defaults | lowest | safe fallbacks |

```python
model_config = SettingsConfigDict(env_nested_delimiter="__")

# FOO__BAR=baz → settings.FOO.BAR
```

## Nested settings

```python
class CorsSettings(BaseModel):
    origins: list[str] = ["http://localhost:3000"]

class Settings(BaseSettings):
    cors: CorsSettings = CorsSettings()
```

Or keep it flat: `CORS_ORIGINS` as a JSON string — simpler for a k8s ConfigMap.

## Secrets

| Bad | Good |
|-----|------|
| JWT in git | Secret manager / k8s Secret |
| `DEBUG=true` in prod | separate values.yaml / prod env |
| One `.env` for every environment | `.env.local`, CI variables |

Secrets course: [`secrets-basic`](../secrets-basic/README.md). Auth — [19-oauth2-jwt](19-oauth2-jwt.md).

## Docker and compose

```yaml
# docker-compose.yml snippet
services:
  api:
    environment:
      DATABASE_URL: postgresql+asyncpg://course:course@postgres:5432/course
      REDIS_URL: redis://redis:6379/0
      JWT_SECRET: ${JWT_SECRET:-dev-only-change-in-prod-32chars}
```

On the host, for labs without compose:

```bash
export DATABASE_URL=postgresql+asyncpg://course:course@localhost:5432/course
```

For direct Postgres — [`deploy/postgres`](../../deploy/postgres/README.md).

## Config loading diagram

```mermaid
flowchart LR
  ENV[OS env vars]
  DOT[.env file]
  DEF[Field defaults]
  ENV --> PS[Settings()]
  DOT --> PS
  DEF --> PS
  PS --> APP[FastAPI lifespan]
```

## Common mistakes

| Mistake | Symptom | Fix |
|---------|---------|-----|
| Committing `.env` | leaked secrets | gitignore it + ship an example |
| `localhost` in compose | API can't see the DB | use the service name `postgres` |
| Creating Settings on every request | wasted env parsing | lru_cache / app.state |
| `extra="forbid"` on Settings | deploy breaks on an extra env var | use `ignore` for forward compatibility |
| Sync DSN with an async engine | obscure driver errors | use `postgresql+asyncpg://` |

## In production

- Startup validation: the app **won't boot** without `JWT_SECRET`.
- Separate settings for the **worker** and **api** processes.
- Feature flags via env ([`gitlab-basic`](../gitlab-basic/README.md) CI variables).

## Summary

**pydantic-settings** types your configuration and reads it from the **environment** plus `.env`. Secrets stay out of the code. **Settings** get wired in through lifespan and Depends. Service URLs in compose use **service names**, not localhost.

## Checklist

- What should you commit to git instead of `.env`?
- Which DSN do you need for async SQLAlchemy?
- Why put `@lru_cache` on `get_settings`?
- Where do you set `JWT_SECRET` in k8s?

Next lesson: [11. Errors and response_model](11-errors-response-model.md).
