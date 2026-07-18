# 10. Настройки: pydantic-settings, env

## Введение: «в проде API стучится в localhost»

Разработчик захардкодил `DATABASE_URL = "postgresql://course:course@localhost:5432/course"`. В Docker Compose Postgres — хост `postgres`, не `localhost`. Деплой падает, в логах connection refused. **Конфигурация через окружение** — обязательный слой; **pydantic-settings** даёт типы, валидацию и `.env` для локальной разработки.

## Что вы узнаете

- **BaseSettings**, источники: env, `.env`, secrets.
- Разделение **dev/staging/prod** без ветвлений в коде.
- Связь settings с **lifespan** и `Depends`.
- Секреты и 12-factor app.

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
# .env.example (коммитить в git)
DATABASE_URL=postgresql+asyncpg://course:course@postgres:5432/course
REDIS_URL=redis://redis:6379/0
JWT_SECRET=change-me-to-32-chars-minimum-secret
DEBUG=true
```

**`.env`** — в `.gitignore`; в репозитории только `.env.example`.

## Использование в приложении

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

`@lru_cache` — один экземпляр на процесс; для тестов — `dependency_overrides` или `os.environ` + clear cache.

## Lifespan и settings

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    cfg = get_settings()
    app.state.engine = create_async_engine(str(cfg.DATABASE_URL))
    yield
    await app.state.engine.dispose()
```

Стенд compose передаёт env в контейнер api — см. [`deploy/fastapi/docker-compose.yml`](../../deploy/fastapi/docker-compose.yml).

## Таблица источников (приоритет)

| Источник | Приоритет | Когда |
|----------|-----------|-------|
| Переменные окружения | высший | prod, k8s Secret |
| `.env` файл | ниже env | локальная разработка |
| Default в классе | низший | безопасные дефолты |

```python
model_config = SettingsConfigDict(env_nested_delimiter="__")

# FOO__BAR=baz → settings.FOO.BAR
```

## Вложенные настройки

```python
class CorsSettings(BaseModel):
    origins: list[str] = ["http://localhost:3000"]

class Settings(BaseSettings):
    cors: CorsSettings = CorsSettings()
```

Или плоско: `CORS_ORIGINS` как JSON-строка — проще для k8s ConfigMap.

## Секреты

| Плохо | Хорошо |
|-------|--------|
| JWT в git | Secret manager / k8s Secret |
| `DEBUG=true` в prod | отдельный values.yaml / env prod |
| Один `.env` на все среды | `.env.local`, CI variables |

Курс secrets: [`secrets-basic`](../secrets-basic/README.md). Auth — [19-oauth2-jwt](19-oauth2-jwt.md).

## Docker и compose

```yaml
# docker-compose.yml фрагмент
services:
  api:
    environment:
      DATABASE_URL: postgresql+asyncpg://course:course@postgres:5432/course
      REDIS_URL: redis://redis:6379/0
      JWT_SECRET: ${JWT_SECRET:-dev-only-change-in-prod-32chars}
```

На хосте для лаб без compose:

```bash
export DATABASE_URL=postgresql+asyncpg://course:course@localhost:5432/course
```

Для прямого Postgres — [`deploy/postgres`](../../deploy/postgres/README.md).

## Диаграмма загрузки конфига

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

## Типичные ошибки

| Ошибка | Симптом | Решение |
|--------|---------|---------|
| Коммит `.env` | утечка секретов | gitignore + example |
| `localhost` в compose | API не видит БД | service name `postgres` |
| Создавать Settings в каждом запросе | лишний парсинг env | lru_cache / app.state |
| `extra="forbid"` на Settings | deploy падает на лишней env | `ignore` для forward-compat |
| Синхронный DSN с async engine | obscure driver errors | `postgresql+asyncpg://` |

## В продакшене

- Валидация при старте: приложение **не поднимается** без `JWT_SECRET`.
- Отдельные settings для **worker** и **api** процессов.
- Feature flags через env ([`gitlab-basic`](../gitlab-basic/README.md) CI variables).

## Резюме

**pydantic-settings** типизирует конфигурацию и читает **environment** + `.env`. Секреты не в коде. **Settings** подключаются в lifespan и Depends. URL сервисов в compose — **имена сервисов**, не localhost.

## Чек-лист

- Что коммитить в git вместо `.env`?
- Какой DSN для async SQLAlchemy?
- Зачем `@lru_cache` на `get_settings`?
- Где задать `JWT_SECRET` в k8s?

Следующий урок: [11. Ошибки и response_model](11-errors-response-model.md).
