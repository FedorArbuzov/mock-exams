# SQLAlchemy Deep (specialization)

A deeply detailed course on **SQLAlchemy 2.0**: **Core** and **ORM**, sync and **async**, relationships, eager loading, **Alembic**, transactions, N+1, Repository, testing. **36 lessons** + capstone + interview cheatsheet.

**Does not duplicate** [`fastapi/13-sqlalchemy-async`](../fastapi/13-sqlalchemy-async.md) — there the ORM is covered **in the context of an API**; here it's **SQLAlchemy as a subject**, deeper and broader (Core, migrations, perf).

**Prerequisites:** Python 3.11+, SQL ([`postgresql-basic`](../postgresql-basic/README.md)). Helpful: [`fastapi`](../fastapi/README.md), [`django`](../django/README.md), [`python-testing`](../python-testing/README.md).

**Locally:** [`deploy/sqlalchemy`](../../deploy/sqlalchemy/README.md):

| Resource | URL / DSN |
|--------|-----------|
| PostgreSQL | `localhost:5433` / db `shop` |
| Lab container | `docker exec -it mock-sqlalchemy-lab bash` |

```bash
cd deploy/sqlalchemy
docker compose up -d --build
bash scripts/smoke.sh
```

## How to read

1. **Theory** → **lab** — code is in [`deploy/sqlalchemy/stack`](../../deploy/sqlalchemy/stack).
2. After **35** — [`interview-cheatsheet.md`](interview-cheatsheet.md).
3. [36-capstone.md](36-capstone.md) — **5–7 hours**.

**Time:** ~50–65 min per "theory + lab" pair; **~22–28 hours** total.

## Curriculum (36 lessons)

### Phase 1. Core and Engine (01–06)
| 01 | [Landscape: Core vs ORM, 1.x vs 2.0](01-landscape-core-orm.md) |
| 02 | [Engine, Connection, text(), Result](02-engine-connection.md) |
| 03 | [Lab: explore the stack + psql](03-lab-explore-stack.md) |
| 04 | [MetaData, Table, Core INSERT/UPDATE](04-metadata-core-crud.md) |
| 05 | [Lab: Core CRUD without ORM](05-lab-core-crud.md) |
| 06 | [select(), where(), join() — SQL Expression](06-core-select-expressions.md) |

### Phase 2. ORM Declarative sync (07–12)
| 07 | [DeclarativeBase, Mapped, mapped_column](07-declarative-models.md) |
| 08 | [Lab: models Category Product](08-lab-declarative-models.md) |
| 09 | [Session: add, flush, commit, rollback](09-session-lifecycle.md) |
| 10 | [Lab: sync Session CRUD](10-lab-sync-session.md) |
| 11 | [ORM queries: select(Model), scalars, where](11-orm-select-20-style.md) |
| 12 | [Lab: filters, order_by, limit](12-lab-orm-queries.md) |

### Phase 3. Relationships (13–18)
| 13 | [relationship, back_populates, lazy](13-relationships-basics.md) |
| 14 | [Lab: Product → Category FK](14-lab-fk-relationship.md) |
| 15 | [joinedload, selectinload, subqueryload](15-eager-loading.md) |
| 16 | [Lab: fix N+1 + EXPLAIN](16-lab-n-plus-one.md) |
| 17 | [Many-to-many, association table](17-many-to-many.md) |
| 18 | [Lab: Product tags M2M](18-lab-tags-m2m.md) |

### Phase 4. Async SQLAlchemy (19–24)
| 19 | [create_async_engine, AsyncSession](19-async-engine-session.md) |
| 20 | [Lab: async setup + queries](20-lab-async-crud.md) |
| 21 | [asyncpg, greenlet, run_sync](21-async-patterns.md) |
| 22 | [Lab: async repository](22-lab-async-repository.md) |
| 23 | [Sync vs async: when to use which](23-sync-vs-async-orm.md) |
| 24 | [Lab: dual engine smoke](24-lab-dual-engine.md) |

### Phase 5. Alembic and transactions (25–30)
| 25 | [Alembic: env.py, autogenerate](25-alembic-intro.md) |
| 26 | [Lab: migration add column](26-lab-alembic-migrate.md) |
| 27 | [Transactions, isolation, savepoints](27-transactions-isolation.md) |
| 28 | [Lab: order + items atomic](28-lab-transaction-order.md) |
| 29 | [Raw SQL, text(), hybrid queries](29-raw-sql-hybrid.md) |
| 30 | [Lab: reporting query](30-lab-reporting-sql.md) |

### Phase 6. Production (31–36)
| 31 | [Repository pattern, Unit of Work](31-repository-uow.md) |
| 32 | [Lab: ProductRepository](32-lab-repository.md) |
| 33 | [Pool, pre_ping, testing ORM](33-pool-testing.md) |
| 34 | [Lab: pytest + test DB](34-lab-pytest-db.md) |
| 35 | [Interview Q&A (top 40)](35-interview-qa.md) |
| 36 | [Capstone: Shop data layer](36-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## What you should end up with

- Writing **Core** and **ORM 2.0** queries confidently.
- Designing **models**, **relationships**, **M2M**.
- Fixing **N+1** via eager loading.
- Working with **async SQLAlchemy** and **Alembic**.
- Testing the data layer without brittle mocks.

## Related courses

| Course | Relation |
|------|-------|
| [`postgresql-basic`](../postgresql-basic/README.md) | SQL, EXPLAIN, indexes |
| [`postgresql-developer`](../postgresql-developer/README.md) | migrations theory |
| [`fastapi`](../fastapi/README.md) | DI + AsyncSession in API |
| [`django`](../django/README.md) | ORM comparison |
| [`python-testing`](../python-testing/README.md) | pytest fixtures |

## Reference code

[`deploy/sqlalchemy/stack/shop`](../../deploy/sqlalchemy/stack/shop) — models, db.py, alembic.
