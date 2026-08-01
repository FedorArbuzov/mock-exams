# 02. Engine, Connection, text(), Result

## Intro

`create_engine()` is a **connection factory** for PostgreSQL. The Engine doesn't hold a permanent connection — the **connection pool** hands out a connection for the duration of an operation.

## What you'll learn

- Engine vs Connection vs Session.
- `connect()`, `begin()`, transactions.
- `text()` for literal SQL.
- Result rows, mappings, scalars.

---

## create_engine

```python
from sqlalchemy import create_engine

engine = create_engine(
    "postgresql+psycopg://course:course@localhost:5433/shop",
    echo=False,           # True — log SQL (dev)
    pool_pre_ping=True,   # check dead connections
    pool_size=5,
    max_overflow=10,
)
```

| Driver | DSN prefix |
|--------|------------|
| psycopg3 | `postgresql+psycopg://` |
| asyncpg | `postgresql+asyncpg://` (async only) |

Sync stack: [`shop/db.py`](../../deploy/sqlalchemy/stack/shop/db.py).

---

## Connection context

```python
with engine.connect() as conn:
    result = conn.execute(text("SELECT version()"))
    print(result.scalar_one())
```

**`connect()`** — autobegin transaction; need **`conn.commit()`** for writes unless using `begin()`.

```python
with engine.begin() as conn:
    conn.execute(text("INSERT INTO categories (name, slug) VALUES ('X', 'x')"))
# auto-commit on exit
```

---

## text() and parameters

```python
from sqlalchemy import text

stmt = text("SELECT * FROM products WHERE sku = :sku")
with engine.connect() as conn:
    row = conn.execute(stmt, {"sku": "BK-001"}).mappings().first()
    print(row["title"])
```

**Always bind parameters** — never f-string SQL ([`postgresql-security`](../postgresql-security/README.md)).

---

## Result API

```python
result = conn.execute(select(...))

result.all()           # list[Row]
result.first()         # Row | None
result.one()           # exactly one or raise
result.scalars()       # ORM / single column
result.mappings()      # dict-like rows
```

---

## Engine vs Session

| | Engine/Connection | Session (ORM) |
|---|-----------------|---------------|
| Level | SQL rows | Python objects |
| Unit of work | manual | identity map |
| Use | Core, scripts | ORM CRUD |

Session builds on Engine — [09-session-lifecycle](09-session-lifecycle.md).

---

## dispose()

```python
engine.dispose()  # close pool — tests, shutdown
```

---

## Common mistakes

| Mistake | Symptom |
|--------|---------|
| Forgot commit on connect() | changes lost |
| SQL injection via f-string | security |
| Leaked connections | pool exhausted |

## Summary

Engine = pool + dialect. Connection = one DB connection. `begin()` for transactions. `text()` + bound params for raw SQL. Result helpers extract rows.

Next: [03-lab-explore-stack](03-lab-explore-stack.md).
