# 19. asyncpg и SQLAlchemy async sessions

## Введение: «API отвечает 200 ms, а Postgres держит 40 соединений»

После [18-lab-parallel-fetch](18-lab-parallel-fetch.md) вы умеете параллельно тянуть HTTP. Следующий шаг — **персистентность**: каждый `await session.execute()` должен **не блокировать** event loop и **не исчерпать** `max_connections` PostgreSQL. Команда подняла FastAPI с `async def`, но забыла про **пул asyncpg** — под нагрузкой 200 RPS база отвечает `FATAL: too many connections`.

Эта глава — теория **asyncpg** и **SQLAlchemy 2.x async**. Практика — [20-lab-async-database](20-lab-async-database.md). Прикладной контекст FastAPI — [27-async-patterns](../fastapi/27-async-patterns.md); стенд — [`deploy/postgres`](../../deploy/postgres/README.md).

## Что вы узнаете

- Как **asyncpg** работает поверх asyncio (протокол PostgreSQL без блокировки).
- **`create_async_engine`**, **`async_sessionmaker`**, lifecycle сессии.
- Параметры пула: `pool_size`, `max_overflow`, `pool_pre_ping`, `pool_recycle`.
- Антипаттерны: sync psycopg2 в `async def`, долгая транзакция с открытой сессией.

---

## asyncpg vs sync драйвер

| | psycopg2 (sync) | asyncpg |
|---|-----------------|---------|
| Модель | blocking socket | non-blocking + await |
| В asyncio | блокирует loop | корректный await |
| Производительность | baseline | меньше overhead на row fetch |
| SQLAlchemy | `create_engine` | `create_async_engine` + `asyncpg` |

```mermaid
flowchart LR
  Coro[Корутина handler]
  Pool[SQLAlchemy pool]
  APG[asyncpg connection]
  PG[(PostgreSQL)]
  Coro -->|await session.execute| Pool
  Pool -->|await| APG
  APG --> PG
```

**Правило:** один **uvicorn worker** = один event loop = один пул на процесс. Несколько workers — несколько пулов ([30-uvloop-production](30-uvloop-production.md)).

---

## Строка подключения и engine

Стенд mock-exams:

```bash
cd deploy/postgres
docker compose up -d
# postgresql://course:course@localhost:5432/course
```

```python
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

DATABASE_URL = "postgresql+asyncpg://course:course@localhost:5432/course"

engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
    echo=False,  # True для отладки SQL
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)
```

| Параметр | Смысл |
|----------|--------|
| `pool_size` | постоянные соединения в пуле |
| `max_overflow` | временные сверх `pool_size` при пике |
| `pool_pre_ping` | `SELECT 1` перед выдачей — отбрасывает мёртвые conn |
| `pool_recycle` | пересоздать conn старше N секунд (NAT, idle timeout) |
| `expire_on_commit=False` | объекты остаются usable после commit (удобно в API) |

**Формула (грубо):** `workers × (pool_size + max_overflow)` ≤ `max_connections` − запас на миграции и админов.

```bash
docker exec mock-postgres psql -U course -d course -c "SHOW max_connections;"
```

---

## Паттерн сессии: короткий scope

```python
from sqlalchemy import text

async def fetch_user_count() -> int:
    async with SessionLocal() as session:
        result = await session.execute(text("SELECT COUNT(*) FROM users"))
        return result.scalar_one()

async def create_user(email: str) -> None:
    async with SessionLocal() as session:
        async with session.begin():
            await session.execute(
                text("INSERT INTO users (email) VALUES (:email)"),
                {"email": email},
            )
        # commit автоматически при выходе из begin()
```

| Паттерн | Когда |
|---------|-------|
| `async with SessionLocal()` | одна операция / request-scoped unit |
| `async with session.begin()` | явная транзакция |
| `yield session` в dependency | FastAPI lifespan ([31-fastapi-bridge](31-fastapi-bridge.md)) |

**Антипаттерн:** держать сессию открытой во время `await httpx.get(...)` — соединение занято, пул истощается.

---

## ORM async (кратко)

```python
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy import select

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str]

async def get_user(session: AsyncSession, user_id: int) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
```

`await session.commit()`, `await session.refresh(obj)` — всё через await. Sync `session.commit()` в корутине = блокировка loop.

---

## Прямой asyncpg (без ORM)

Для микро-сервисов или batch ETL иногда достаточно **asyncpg** напрямую:

```python
import asyncpg

async def direct_query() -> list[asyncpg.Record]:
    conn = await asyncpg.connect(
        "postgresql://course:course@localhost:5432/course"
    )
    try:
        rows = await conn.fetch("SELECT id, email FROM users LIMIT 10")
        return rows
    finally:
        await conn.close()

# Пул asyncpg
async def with_pool():
    pool = await asyncpg.create_pool(
        "postgresql://course:course@localhost:5432/course",
        min_size=2,
        max_size=10,
    )
    async with pool.acquire() as conn:
        return await conn.fetchval("SELECT 1")
    await pool.close()
```

SQLAlchemy async engine внутри использует asyncpg — не смешивайте два пула на один процесс без причины.

---

## Типичные ошибки

| Ошибка | Почему плохо | Как правильно |
|--------|--------------|---------------|
| `create_engine` (sync) в FastAPI async | блок loop на каждом query | `create_async_engine` |
| N+1 без `selectinload` | лавина await к БД | eager load или raw SQL |
| `pool_size=50` на 1 worker | 50 conn на мало RPS | начните с 5–10, измерьте |
| Забыли `await engine.dispose()` | leaked connections при shutdown | lifespan / `atexit` |
| Долгий CPU внутри `async with session` | conn не возвращается в пул | commit → release → CPU |

---

## На стенде

```bash
cd deploy/postgres && docker compose up -d
docker exec mock-postgres psql -U course -d course -c "\dt"
```

Таблицы появятся после лабы [20-lab-async-database](20-lab-async-database.md). Для smoke:

```bash
docker exec mock-postgres psql -U course -d course -c "SELECT 1 AS ok;"
```

---

## В продакшене

- **Метрики:** pool checkout time, `pg_stat_activity`, idle in transaction.
- **Миграции:** Alembic sync engine отдельно от runtime async pool.
- **Read replica:** второй engine с read-only URL; не шарить session между write/read без routing.
- **Связь с Redis:** cache-aside после read — [21-redis-asyncio](21-redis-asyncio.md).

---

## Резюме

**asyncpg** даёт неблокирующий доступ к PostgreSQL; **SQLAlchemy async** добавляет ORM и пул. Держите сессии **короткими**, считайте **connections × workers**, используйте **`pool_pre_ping`**. Async HTTP без async DB — половина архитектуры.

## Чек-лист

- Чем `create_async_engine` отличается от `create_engine`?
- Зачем `pool_pre_ping` на стенде с Docker restart?
- Почему нельзя держать session во время внешнего HTTP?
- Как связаны uvicorn workers и размер пула?

Следующий урок: [20. Лаба: async database](20-lab-async-database.md).
