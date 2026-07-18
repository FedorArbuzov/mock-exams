# 18. Integration tests с БД: sqlite, transactions, fixtures

## Введение: «unit green, sqlite schema migration сломала prod»

In-memory **sqlite** в integration tests — компромисс: real SQL, без Docker PostgreSQL. Паттерн **transaction rollback** — чистая БД на каждый test без `DROP TABLE`.

## Что вы узнаете

- **`:memory:`** vs file sqlite.
- Fixture **connection + rollback**.
- Когда sqlite **не** подходит (postgres-specific types).
- Связь с [`postgresql-developer`](../postgresql-developer/README.md).

---

## Минимальная schema fixture

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

`unit_price` как TEXT — храните Decimal str; в prod — NUMERIC.

---

## Repository под test

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

Domain `Cart` + repo — граница integration.

---

## rollback vs truncate

| | rollback | DELETE ALL |
|---|----------|------------|
| Speed | fast | ok |
| FK constraints | depends | careful |
| commit in code | breaks rollback | use separate conn |

Для tests **не** commit в repository если используете rollback fixture — или nested transaction pattern.

---

## postgres vs sqlite

| | sqlite test | postgres test |
|---|-------------|---------------|
| Speed | ms | seconds + docker |
| Fidelity | SQL subset | production-like |
| Tool | built-in | testcontainers / deploy/postgres |

Курс: sqlite для **pattern**; postgres — [22-testcontainers](22-testcontainers.md).

---

## aiosqlite preview

Async variant — [25-lab-async-tests](25-lab-async-tests.md). API тот же `:memory:`.

---

## Типичные ошибки

| Ошибка | Последствие | Что делать |
|--------|-------------|------------|
| Shared file sqlite.db | parallel fail | :memory: per test |
| commit in test | leak | rollback fixture |
| Test postgres syntax in sqlite | false green | marker integration pg |

## На собеседовании

- Как изолировать DB test без recreate schema?
- Когда sqlite **недостаточно**?

## Резюме

sqlite :memory: + fixture — integration pattern для persistence. Repository test без mock SQL driver. postgres — testcontainers для fidelity.

Далее: [19-lab-db-tests](19-lab-db-tests.md).
