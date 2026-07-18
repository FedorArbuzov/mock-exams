# 22. Testcontainers: PostgreSQL и Redis в pytest

## Введение: «sqlite green, postgres JSONB migration red»

sqlite не поддерживает **postgres-specific** фичи. **Testcontainers** поднимает real PostgreSQL в Docker **на session** — fidelity без shared dev DB.

## Что вы узнаете

- Паттерн **session-scoped container**.
- **`testcontainers-postgres`** (conceptual — можно [`deploy/postgres`](../../deploy/postgres/README.md)).
- Trade-off **speed vs fidelity**.
- Когда достаточно sqlite из [18-integration-db](18-integration-db.md).

---

## Conceptual fixture

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

См. [`fastapi/13-sqlalchemy-async`](../fastapi/13-sqlalchemy-async.md).

---

## Альтернатива mock-exams: deploy/postgres

Без testcontainers library:

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

Проще для курса — **reuse** existing stack.

---

## Session vs function scope container

| scope | Container | Speed |
|-------|-----------|-------|
| session | один на pytest run | быстрее |
| function | per test | изоляция, медленно |

Для function isolation — **TRUNCATE** tables или nested transactions.

---

## CI requirements

| Requirement | GitLab docker executor |
|-------------|------------------------|
| Docker socket | `docker:dind` service |
| RAM | postgres 512m+ |

MR job часто **без** testcontainers — только nightly.

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| No docker in CI | skip all | marker + nightly |
| Port conflict 5432 | fail start | random port mapping |
| Leaked container | disk full | context manager `with` |

## На собеседовании

- Testcontainers vs **shared staging DB**?
- Когда sqlite достаточно?

## Резюме

Testcontainers — real postgres/redis per session. mock-exams: deploy/postgres alternative. Gate heavy integration in nightly CI.

Далее: [23-lab-integration](23-lab-integration.md).
