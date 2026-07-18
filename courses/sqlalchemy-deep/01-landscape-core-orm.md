# 01. Ландшафт: Core vs ORM, 1.x vs 2.0

## Введение: «ORM медленный» — но где именно?

Team lead открывает лог: один endpoint — **47 SQL-запросов** на list из 20 товаров. Junior говорит: «ORM — garbage, пишем raw SQL». Senior спрашивает: **Core или ORM**, **lazy loading**, **session scope**? Без карты SQLAlchemy спор бессмысленный.

SQLAlchemy — не «одна ORM», а **два слоя**: **SQL Expression Language (Core)** и **ORM** поверх него. Версия **2.0** унифицировала стиль: везде `select()`, typed `Mapped[]`, меньше magic.

## Что вы узнаете

- Core vs ORM — когда какой слой.
- SQLAlchemy 1.x → 2.0 breaking changes (orientir).
- Сравнение с Django ORM и «голым» asyncpg.

---

## Два слоя SQLAlchemy

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

| Слой | Абстракция | Когда |
|------|------------|-------|
| **Core** | tables, columns, SQL expressions | bulk ops, migrations, complex SQL, libraries |
| **ORM** | Python classes ↔ rows | business domain, CRUD apps |
| **Both** | ORM generates Core SQL | typical FastAPI/Django-style apps |

ORM **не обязателен** — можно только Core (как многие data pipelines).

---

## Core example (preview)

```python
from sqlalchemy import create_engine, insert, select, table, column

engine = create_engine("postgresql+psycopg://course:course@localhost:5433/shop")
products = table("products", column("id"), column("sku"), column("price"))

with engine.connect() as conn:
    rows = conn.execute(select(products.c.sku, products.c.price).limit(5)).all()
```

Подробно: [04-metadata-core-crud](04-metadata-core-crud.md).

---

## ORM example (2.0 style)

```python
from sqlalchemy import select
from sqlalchemy.orm import Session
from shop.models import Product

with Session(engine) as session:
    products = session.scalars(select(Product).where(Product.is_active == True).limit(5)).all()
```

Подробно: [07-declarative-models](07-declarative-models.md).

---

## SQLAlchemy 1.x vs 2.0

| 1.x (legacy) | 2.0 (now) |
|--------------|-----------|
| `session.query(Product)` | `session.scalars(select(Product))` |
| `declarative_base()` | `class Base(DeclarativeBase)` |
| `Column(Integer)` untyped | `Mapped[int] = mapped_column()` |
| implicit autocommit confusion | explicit `session.commit()` |
| `future=True` flag | default 2.0 style |

[`fastapi/13`](../fastapi/13-sqlalchemy-async.md) assumes 2.0 async — этот курс даёт **фундамент** под него.

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

## Когда Core без ORM

- Bulk insert 100k rows — `insert()` executemany
- ETL / reporting — controlled SQL
- Alembic migrations — `op.create_table`
- Micro-optimization — exact SQL shape

---

## Когда ORM

- CRUD domain models
- Relationships navigation `product.category.name`
- Identity map в Session ( один объект = один row per session)

---

## Стенд курса

[`deploy/sqlalchemy`](../../deploy/sqlalchemy/README.md) — Postgres **5433**, models `Category`, `Product`, `Tag`, `Order`.

---

## Типичные ошибки

| Миф | Реальность |
|-----|------------|
| ORM always slow | N+1 и bad queries, not ORM itself |
| Raw SQL always faster | ORM + eager load often same plan |
| 2.0 removed Core | Core is first-class |

## Резюме

SQLAlchemy = **Core (SQL)** + **ORM (objects)**. 2.0 = `select()` everywhere, `Mapped` types. Choose layer by task; ORM for domain, Core for bulk/reporting.

Далее: [02-engine-connection](02-engine-connection.md).
