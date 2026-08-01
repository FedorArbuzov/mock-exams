# 01. The Landscape: Core vs ORM, 1.x vs 2.0

## Intro: "The ORM is slow" — but where exactly?

The team lead opens the log: one endpoint fires **47 SQL queries** for a list of 20 products. The junior says: "the ORM is garbage, let's write raw SQL." The senior asks: **Core or ORM**, **lazy loading**, **session scope**? Without a map of SQLAlchemy, the argument goes nowhere.

SQLAlchemy isn't "one ORM" — it's **two layers**: the **SQL Expression Language (Core)** and the **ORM** built on top of it. Version **2.0** unified the style: `select()` everywhere, typed `Mapped[]`, less magic.

## What you'll learn

- Core vs ORM — which layer to use when.
- SQLAlchemy 1.x → 2.0 breaking changes (a quick orientation).
- Comparison with Django ORM and "bare" asyncpg.

---

## SQLAlchemy's two layers

```mermaid
flowchart TB
  App[Application code]
  ORM[ORM: Mapped classes Session]
  Core[Core: Table MetaData select insert]
  DB[(PostgreSQL)]

  App --> ORM
  App --> Core
  ORM --> Core
  Core --> DB
```

| Layer | Abstraction | When |
|------|------------|-------|
| **Core** | tables, columns, SQL expressions | bulk ops, migrations, complex SQL, libraries |
| **ORM** | Python classes ↔ rows | business domain, CRUD apps |
| **Both** | ORM generates Core SQL | typical FastAPI/Django-style apps |

The ORM is **not mandatory** — you can use Core alone (plenty of data pipelines do exactly that).

---

## Core example (preview)

```python
from sqlalchemy import create_engine, insert, select, table, column

engine = create_engine("postgresql+psycopg://course:course@localhost:5433/shop")
products = table("products", column("id"), column("sku"), column("price"))

with engine.connect() as conn:
    rows = conn.execute(select(products.c.sku, products.c.price).limit(5)).all()
```

Details: [04-metadata-core-crud](04-metadata-core-crud.md).

---

## ORM example (2.0 style)

```python
from sqlalchemy import select
from sqlalchemy.orm import Session
from shop.models import Product

with Session(engine) as session:
    products = session.scalars(select(Product).where(Product.is_active == True).limit(5)).all()
```

Details: [07-declarative-models](07-declarative-models.md).

---

## SQLAlchemy 1.x vs 2.0

| 1.x (legacy) | 2.0 (now) |
|--------------|-----------|
| `session.query(Product)` | `session.scalars(select(Product))` |
| `declarative_base()` | `class Base(DeclarativeBase)` |
| `Column(Integer)` untyped | `Mapped[int] = mapped_column()` |
| implicit autocommit confusion | explicit `session.commit()` |
| `future=True` flag | default 2.0 style |

[`fastapi/13`](../fastapi/13-sqlalchemy-async.md) assumes 2.0 async — this course gives you the **foundation** underneath it.

---

## SQLAlchemy vs alternatives

| Tool | Model |
|------|-------|
| **SQLAlchemy** | Core + ORM, sync + async |
| **Django ORM** | ORM only, sync, framework-coupled |
| **asyncpg** | driver only, raw SQL |
| **SQLModel** | Pydantic + SQLAlchemy sugar |
| **Peewee** | lighter ORM |

---

## When to use Core without the ORM

- Bulk insert 100k rows — `insert()` executemany
- ETL / reporting — controlled SQL
- Alembic migrations — `op.create_table`
- Micro-optimization — exact SQL shape

---

## When to use the ORM

- CRUD domain models
- Relationship navigation, `product.category.name`
- Identity map in the Session (one object = one row per session)

---

## Course stand

[`deploy/sqlalchemy`](../../deploy/sqlalchemy/README.md) — Postgres on **5433**, models `Category`, `Product`, `Tag`, `Order`.

---

## Common misconceptions

| Myth | Reality |
|-----|------------|
| ORM always slow | N+1 and bad queries, not the ORM itself |
| Raw SQL always faster | ORM + eager load often produce the same plan |
| 2.0 removed Core | Core is first-class |

## Summary

SQLAlchemy = **Core (SQL)** + **ORM (objects)**. 2.0 means `select()` everywhere and `Mapped` types. Pick the layer by task: ORM for the domain, Core for bulk/reporting.

Next: [02-engine-connection](02-engine-connection.md).
