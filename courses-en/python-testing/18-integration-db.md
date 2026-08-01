# 18. Integration tests with a DB: sqlite, transactions, fixtures

## Intro: "unit green, a sqlite schema migration broke prod"

In-memory **sqlite** in integration tests is a compromise: real SQL, without a Docker PostgreSQL. The **transaction rollback** pattern gives a clean DB for each test without `DROP TABLE`.

## What you'll learn

- **`:memory:`** vs file sqlite.
- A fixture with **connection + rollback**.
- When sqlite is **not** suitable (postgres-specific types).
- The link to [`postgresql-developer`](../postgresql-developer/README.md).

---

## A minimal schema fixture

```python
import sqlite3
import pytest


@pytest.fixture
def db_conn():
    conn = sqlite3.connect(":memory:")
    conn.execute("""
        CREATE TABLE cart_lines (
            id INTEGER PRIMARY KEY,
            sku TEXT NOT NULL,
            unit_price TEXT NOT NULL,
            quantity INTEGER NOT NULL
        )
    """)
    yield conn
    conn.rollback()
    conn.close()
```

`unit_price` as TEXT — store the Decimal string; in prod — NUMERIC.

---

## A repository under test

```python
from decimal import Decimal


class SqliteCartRepository:
    def __init__(self, conn):
        self._conn = conn

    def save_lines(self, lines: list[tuple[str, Decimal, int]]) -> None:
        self._conn.execute("DELETE FROM cart_lines")
        self._conn.executemany(
            "INSERT INTO cart_lines (sku, unit_price, quantity) VALUES (?, ?, ?)",
            [(s, str(p), q) for s, p, q in lines],
        )
        self._conn.commit()

    def count_lines(self) -> int:
        cur = self._conn.execute("SELECT COUNT(*) FROM cart_lines")
        return cur.fetchone()[0]
```

---

## Integration test

```python
def test_save_lines_roundtrip(db_conn):
    repo = SqliteCartRepository(db_conn)
    repo.save_lines([("A", Decimal("10.00"), 2)])
    assert repo.count_lines() == 1
```

Domain `Cart` + repo — the integration boundary.

---

## rollback vs truncate

| | rollback | DELETE ALL |
|---|----------|------------|
| Speed | fast | ok |
| FK constraints | depends | careful |
| commit in code | breaks rollback | use a separate conn |

For tests, **don't** commit in the repository if you use a rollback fixture — or use the nested transaction pattern.

---

## postgres vs sqlite

| | sqlite test | postgres test |
|---|-------------|---------------|
| Speed | ms | seconds + docker |
| Fidelity | SQL subset | production-like |
| Tool | built-in | testcontainers / deploy/postgres |

Course: sqlite for the **pattern**; postgres — [22-testcontainers](22-testcontainers.md).

---

## aiosqlite preview

The async variant — [25-lab-async-tests](25-lab-async-tests.md). Same `:memory:` API.

---

## Common mistakes

| Mistake | Consequence | What to do |
|--------|-------------|------------|
| Shared file sqlite.db | parallel fail | :memory: per test |
| commit in test | leak | rollback fixture |
| Testing postgres syntax in sqlite | false green | integration pg marker |

## Interview questions

- How to isolate a DB test without recreating the schema?
- When is sqlite **insufficient**?

## Summary

sqlite :memory: + fixture — the integration pattern for persistence. Repository test without mocking the SQL driver. postgres — testcontainers for fidelity.

Next: [19-lab-db-tests](19-lab-db-tests.md).
