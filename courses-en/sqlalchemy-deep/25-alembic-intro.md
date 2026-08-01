# 25. Alembic: env.py, autogenerate

## Intro

`Base.metadata.create_all()` — dev only. **Alembic** — versioned migrations, team sync, CI deploy.

[`postgresql-developer`](../postgresql-developer/README.md) — Flyway comparison.

## What you'll learn

- alembic.ini, env.py, versions/.
- upgrade/downgrade.
- autogenerate workflow.
- Data migrations RunPython.

---

## Project layout

```text
alembic.ini
alembic/
  env.py
  versions/
    0001_initial.py
shop/models.py  → target_metadata = Base.metadata
```

Stand: [`deploy/sqlalchemy/stack/alembic`](../../deploy/sqlalchemy/stack/alembic).

---

## env.py essentials

```python
from shop.models import Base
target_metadata = Base.metadata
config.set_main_option("sqlalchemy.url", settings.database_url)
```

Online migrations use live DB connection.

---

## Commands

```bash
alembic upgrade head
alembic downgrade -1
alembic history
alembic current
alembic revision --autogenerate -m "add column"
```

---

## autogenerate workflow

1. Change `models.py`
2. `alembic revision --autogenerate -m "..."`
3. **Review** generated file — autogen misses renames, data backfills
4. `alembic upgrade head`
5. Commit migration file to git

---

## Manual revision

```bash
alembic revision -m "manual index"
```

Edit `upgrade()` / `downgrade()` with `op.create_index(...)`.

---

## Data migration

```python
def upgrade():
    op.add_column("products", sa.Column("featured", sa.Boolean(), server_default="false"))
    op.execute("UPDATE products SET featured = true WHERE price > 100")
    op.alter_column("products", "featured", server_default=None)
```

---

## Never edit applied migration

Production already ran `0002` — don't change file; create `0003` fix forward.

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Empty autogen diff | import all models in env.py |
| Multiple heads | alembic merge |
| upgrade without backup | pg_dump first prod |

## Summary

Alembic tracks schema versions. autogenerate from models — always review. Forward-only fixes in prod.

Next: [26-lab-alembic-migrate](26-lab-alembic-migrate.md).
