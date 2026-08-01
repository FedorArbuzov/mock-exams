# 22. Testcontainers: PostgreSQL and Redis in pytest

## Intro: "sqlite green, a postgres JSONB migration red"

sqlite doesn't support **postgres-specific** features. **Testcontainers** spins up a real PostgreSQL in Docker **for the session** — fidelity without a shared dev DB.

## What you'll learn

- The **session-scoped container** pattern.
- **`testcontainers-postgres`** (conceptual — you can use [`deploy/postgres`](../../deploy/postgres/README.md)).
- The **speed vs fidelity** trade-off.
- When the sqlite from [18-integration-db](18-integration-db.md) is enough.

---

## A conceptual fixture

```python
import pytest

pytest.importorskip("testcontainers.postgres")
from testcontainers.postgres import PostgresContainer


@pytest.fixture(scope="session")
def postgres_url():
    with PostgresContainer("postgres:16-alpine") as pg:
        yield pg.get_connection_url()
```

Requires: Docker running, `pip install testcontainers[postgres]`.

---

## Async SQLAlchemy test (sketch)

```python
@pytest.fixture
async def async_session(postgres_url):
    from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
    engine = create_async_engine(postgres_url.replace("postgresql://", "postgresql+asyncpg://"))
    Session = async_sessionmaker(engine)
    async with Session() as session:
        yield session
    await engine.dispose()
```

See [`fastapi/13-sqlalchemy-async`](../fastapi/13-sqlalchemy-async.md).

---

## The mock-exams alternative: deploy/postgres

Without the testcontainers library:

```bash
cd deploy/postgres && docker compose up -d
```

```python
import os
import pytest

POSTGRES_DSN = os.getenv(
    "TEST_POSTGRES_DSN",
    "postgresql://course:course@localhost:5432/course",
)


@pytest.fixture(scope="session")
def postgres_dsn():
    return POSTGRES_DSN


@pytest.mark.integration
def test_pg_connect(postgres_dsn):
    import psycopg
    with psycopg.connect(postgres_dsn) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
            assert cur.fetchone()[0] == 1
```

Simpler for the course — **reuse** the existing stack.

---

## Session vs function scope container

| scope | Container | Speed |
|-------|-----------|-------|
| session | one per pytest run | faster |
| function | per test | isolation, slow |

For function isolation — **TRUNCATE** tables or nested transactions.

---

## CI requirements

| Requirement | GitLab docker executor |
|-------------|------------------------|
| Docker socket | `docker:dind` service |
| RAM | postgres 512m+ |

The MR job often runs **without** testcontainers — only nightly.

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| No docker in CI | skip all | marker + nightly |
| Port conflict 5432 | fail to start | random port mapping |
| Leaked container | disk full | context manager `with` |

## Interview questions

- Testcontainers vs a **shared staging DB**?
- When is sqlite enough?

## Summary

Testcontainers — real postgres/redis per session. mock-exams: the deploy/postgres alternative. Gate heavy integration in nightly CI.

Next: [23-lab-integration](23-lab-integration.md).
