# 20. Lab: async database

## Lab goal

Connect to PostgreSQL via **SQLAlchemy async + asyncpg** or locally via **aiosqlite**. Implement CRUD, measure concurrent reads and make sure the pool isn't exhausted with parallel `gather`.

## Prerequisites

- [19-asyncpg-database](19-asyncpg-database.md).
- The [`deploy/postgres`](../../deploy/postgres/README.md) stand **or** a SQLite file.
- venv: `pip install -r examples/requirements-lab.txt sqlalchemy asyncpg`

```bash
cd deploy/postgres && docker compose up -d
docker exec mock-postgres psql -U course -d course -c "SELECT 1;"
```

---

## Task 1. Schema and engine

**Why:** a single connection point for all the labs.

`labs/20_db_setup.py`:

```python
import asyncio
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

# Postgres (the mock-exams stand)
DATABASE_URL = "postgresql+asyncpg://course:course@localhost:5432/course"

# Alternative without Docker:
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

**Run:** `python labs/20_db_setup.py`

**What you'll see:** `schema ok`, the `fetch_log` table in `\dt` or `.tables`.

---

## Task 2. Insert a batch from the mock gateway

**Why:** to tie HTTP lab 18 to persistence.

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

**What you'll see:** `rows: 3`, HTTP elapsed ≈ max delay (~250 ms), not the sum.

---

## Task 3. Concurrent reads + the pool

**Why:** 20 parallel SELECTs shouldn't fail with a pool timeout.

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

**What you'll see:** all 20 finish; with `pool_size=2` a small delay is possible, but no deadlock.

---

## Task 4. Transaction and rollback

**Why:** to understand `async with session.begin()`.

```python
async def demo_rollback():
    async with SessionLocal() as session:
        async with session.begin():
            await session.execute(
                text("INSERT INTO fetch_log (url, status_code, latency_ms) VALUES ('x', 0, 0)")
            )
            raise ValueError("abort")
    # the transaction was rolled back

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

**What you'll see:** `after` equals `before` — the insert wasn't committed.

---

## Task 5. dispose on shutdown

**Why:** an analog of the FastAPI lifespan.

```python
async def shutdown():
    await engine.dispose()
    print("pool disposed")

# at the end of main():
# await shutdown()
```

A repeat `SessionLocal()` after `dispose()` should fail — the pool is closed.

---

## If it doesn't work

| Symptom | Action |
|---------|----------|
| `Connection refused :5432` | `docker compose ps` in deploy/postgres |
| `asyncpg` ModuleNotFound | `pip install asyncpg sqlalchemy` |
| SQLite: syntax error SERIAL | use the `sqlite` branch in init_schema |
| Pool timeout | reduce concurrency or increase `pool_size` |
| Gateway 503 | bring up deploy/python-async :8095 |

---

## Success criteria

- [ ] The schema is created on Postgres or aiosqlite
- [ ] Three parallel fetches are written to `fetch_log`
- [ ] 20 concurrent reads finish without error
- [ ] Rollback doesn't increase the row count
- [ ] `engine.dispose()` closes the pool

---

## Cleanup

```bash
# optional: clear the log
docker exec mock-postgres psql -U course -d course -c "TRUNCATE fetch_log;"
```

SQLite: delete `labs/20_lab.db`.

---

## Self-check questions

1. Why is the insert done in a separate `async with SessionLocal()` for each fetch?
2. What happens with 100 concurrent reads and `pool_size=5`?
3. When would you choose aiosqlite over Postgres?
4. How is this table used in [36-capstone](36-capstone.md)?

Next lesson: [21. Redis asyncio](21-redis-asyncio.md).
