# 20. Лаба: async database

## Цель лабы

Подключиться к PostgreSQL через **SQLAlchemy async + asyncpg** или локально через **aiosqlite**. Реализовать CRUD, измерить concurrent reads и убедиться, что пул не исчерпывается при параллельных `gather`.

## Предварительно

- [19-asyncpg-database](19-asyncpg-database.md).
- Стенд [`deploy/postgres`](../../deploy/postgres/README.md) **или** файл SQLite.
- venv: `pip install -r examples/requirements-lab.txt sqlalchemy asyncpg`

```bash
cd deploy/postgres && docker compose up -d
docker exec mock-postgres psql -U course -d course -c "SELECT 1;"
```

---

## Задание 1. Схема и engine

**Зачем:** единая точка подключения для всех лаб.

`labs/20_db_setup.py`:

```python
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Postgres (стенд mock-exams)
DATABASE_URL = "postgresql+asyncpg://course:course@localhost:5432/course"

# Альтернатива без Docker:
# DATABASE_URL = "sqlite+aiosqlite:///./labs/20_lab.db"

engine = create_async_engine(DATABASE_URL, pool_size=5, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, expire_on_commit=False)

SCHEMA = """
CREATE TABLE IF NOT EXISTS fetch_log (
    id SERIAL PRIMARY KEY,
    url TEXT NOT NULL,
    status_code INTEGER NOT NULL,
    latency_ms REAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""

async def init_schema() -> None:
    async with engine.begin() as conn:
        if "sqlite" in DATABASE_URL:
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS fetch_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    url TEXT NOT NULL,
                    status_code INTEGER NOT NULL,
                    latency_ms REAL NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP
                );
            """))
        else:
            await conn.execute(text(SCHEMA))

if __name__ == "__main__":
    asyncio.run(init_schema())
    print("schema ok")
```

**Запуск:** `python labs/20_db_setup.py`

**Что увидите:** `schema ok`, таблица `fetch_log` в `\dt` или `.tables`.

---

## Задание 2. Insert batch из mock gateway

**Зачем:** связать HTTP-лабу 18 с персистентностью.

```python
import time
import httpx
from sqlalchemy import text

BASE = "http://localhost:8095"

async def log_fetch(session: AsyncSession, url: str, status: int, latency_ms: float) -> None:
    await session.execute(
        text(
            "INSERT INTO fetch_log (url, status_code, latency_ms) "
            "VALUES (:url, :status, :latency)"
        ),
        {"url": url, "status": status, "latency": latency_ms},
    )
    await session.commit()

async def fetch_and_log(client: httpx.AsyncClient, path: str) -> None:
    url = f"{BASE}{path}"
    t0 = time.perf_counter()
    r = await client.get(url)
    latency = (time.perf_counter() - t0) * 1000
    async with SessionLocal() as session:
        await log_fetch(session, url, r.status_code, latency)

async def main():
    await init_schema()
    async with httpx.AsyncClient(timeout=30.0) as client:
        await asyncio.gather(
            fetch_and_log(client, "/health"),
            fetch_and_log(client, "/json?size=5"),
            fetch_and_log(client, "/slow?extra_ms=50"),
        )
    async with SessionLocal() as session:
        r = await session.execute(text("SELECT COUNT(*) FROM fetch_log"))
        print("rows:", r.scalar_one())

if __name__ == "__main__":
    asyncio.run(main())
```

**Что увидите:** `rows: 3`, elapsed HTTP ≈ max delay (~250 ms), не сумма.

---

## Задание 3. Concurrent reads + пул

**Зачем:** 20 параллельных SELECT не должны падать с pool timeout.

```python
async def read_count(n: int) -> int:
    async with SessionLocal() as session:
        r = await session.execute(text("SELECT COUNT(*) FROM fetch_log"))
        return r.scalar_one()

async def stress_reads():
    results = await asyncio.gather(*[read_count(i) for i in range(20)])
    print("reads ok, sample:", results[:3])

asyncio.run(stress_reads())
```

**Что увидите:** все 20 завершаются; при `pool_size=2` возможна небольшая задержка, но не deadlock.

---

## Задание 4. Транзакция и rollback

**Зачем:** понять `async with session.begin()`.

```python
async def demo_rollback():
    async with SessionLocal() as session:
        async with session.begin():
            await session.execute(
                text("INSERT INTO fetch_log (url, status_code, latency_ms) VALUES ('x', 0, 0)")
            )
            raise ValueError("abort")
    # транзакция откатилась

async def count_rows() -> int:
    async with SessionLocal() as session:
        r = await session.execute(text("SELECT COUNT(*) FROM fetch_log"))
        return r.scalar_one()

async def main():
    before = await count_rows()
    try:
        await demo_rollback()
    except ValueError:
        pass
    after = await count_rows()
    print(f"before={before} after={after} (unchanged)")

asyncio.run(main())
```

**Что увидите:** `after` равен `before` — insert не закоммичен.

---

## Задание 5. dispose при shutdown

**Зачем:** аналог FastAPI lifespan.

```python
async def shutdown():
    await engine.dispose()
    print("pool disposed")

# в конце main():
# await shutdown()
```

Повторный `SessionLocal()` после `dispose()` должен падать — пул закрыт.

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| `Connection refused :5432` | `docker compose ps` в deploy/postgres |
| `asyncpg` ModuleNotFound | `pip install asyncpg sqlalchemy` |
| SQLite: syntax error SERIAL | используйте ветку `sqlite` в init_schema |
| Pool timeout | уменьшите concurrency или увеличьте `pool_size` |
| Gateway 503 | поднимите deploy/python-async :8095 |

---

## Критерии успеха

- [ ] Схема создана на Postgres или aiosqlite
- [ ] Три parallel fetch записаны в `fetch_log`
- [ ] 20 concurrent reads завершаются без ошибки
- [ ] Rollback не увеличивает счётчик строк
- [ ] `engine.dispose()` закрывает пул

---

## Уборка

```bash
# опционально: очистить лог
docker exec mock-postgres psql -U course -d course -c "TRUNCATE fetch_log;"
```

SQLite: удалите `labs/20_lab.db`.

---

## Вопросы для самопроверки

1. Почему insert делается в отдельном `async with SessionLocal()` на каждый fetch?
2. Что произойдёт при 100 concurrent reads и `pool_size=5`?
3. Когда выбрать aiosqlite вместо Postgres?
4. Как эта таблица используется в [36-capstone](36-capstone.md)?

Следующий урок: [21. Redis asyncio](21-redis-asyncio.md).
