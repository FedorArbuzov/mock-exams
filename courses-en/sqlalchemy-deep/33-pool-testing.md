# 33. Pool, pre_ping, testing ORM

## Intro

Production: connection pool sizing, stale connections, test isolation without polluting dev DB.

## What you'll learn

- pool_size, max_overflow, pool_recycle.
- pool_pre_ping.
- pytest: transaction rollback fixture, sqlite optional.

---

## Pool settings

```python
create_engine(
    url,
    pool_size=5,        # persistent connections
    max_overflow=10,  # burst extra
    pool_timeout=30,  # wait for connection
    pool_recycle=1800,  # reconnect after 30 min (PG idle timeout)
    pool_pre_ping=True,  # SELECT 1 before checkout
)
```

Rule of thumb: `pool_size + max_overflow` × workers ≤ postgres `max_connections`.

---

## NullPool

Alembic migrations often use `NullPool` — no pooling, one connection per migration run. See [`alembic/env.py`](../../deploy/sqlalchemy/stack/alembic/env.py).

---

## Testing strategies

| Strategy | Pros |
|----------|------|
| **SQLite :memory:** | fast, limited PG features |
| **Postgres test DB + rollback** | accurate |
| **Docker postgres per CI job** | isolation |

---

## Rollback fixture (Postgres)

```python
import pytest
from sqlalchemy import event
from shop.db import sync_engine, SyncSessionLocal

@pytest.fixture
def db_session():
    connection = sync_engine.connect()
    transaction = connection.begin()
    session = SyncSessionLocal(bind=connection)
    nested = connection.begin_nested()

    @event.listens_for(session, "after_transaction_end")
    def restart_savepoint(sess, trans):
        if trans.nested and not trans._parent.nested:
            connection.begin_nested()

    yield session
    session.close()
    transaction.rollback()
    connection.close()
```

Each test rolls back — no leftover data.

---

## pytest-asyncio

```python
@pytest.mark.asyncio
async def test_async_repo(db_async_session):
    repo = AsyncProductRepository(db_async_session)
    ...
```

---

## echo in tests

Keep `echo=False` — use logging if debugging SQL.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Shared session between tests | fixture per test |
| SQLite tests pass, PG fails | CI on postgres |
| Pool too big | math vs max_connections |

## Summary

Tune pool for workers and PG limits. pre_ping + recycle for reliability. Test with rollback fixture on real PG when possible.

Next: [34-lab-pytest-db](34-lab-pytest-db.md).
