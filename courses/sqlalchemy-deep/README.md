# SQLAlchemy Deep (специализация)

Мега-подробный курс по **SQLAlchemy 2.0**: **Core** и **ORM**, sync и **async**, relationships, eager loading, **Alembic**, transactions, N+1, Repository, testing. **36 уроков** + capstone + interview cheatsheet.

**Не дублирует** [`fastapi/13-sqlalchemy-async`](../fastapi/13-sqlalchemy-async.md) — там ORM **в контексте API**; здесь — **SQLAlchemy как предмет**, глубже и шире (Core, migrations, perf).

**Предварительно:** Python 3.11+, SQL ([`postgresql-basic`](../postgresql-basic/README.md)). Полезно: [`fastapi`](../fastapi/README.md), [`django`](../django/README.md), [`python-testing`](../python-testing/README.md).

**Локально:** [`deploy/sqlalchemy`](../../deploy/sqlalchemy/README.md):

| Ресурс | URL / DSN |
|--------|-----------|
| PostgreSQL | `localhost:5433` / db `shop` |
| Lab container | `docker exec -it mock-sqlalchemy-lab bash` |

```bash
cd deploy/sqlalchemy
docker compose up -d --build
bash scripts/smoke.sh
```

## Как читать

1. **Теория** → **лаба** — код в [`deploy/sqlalchemy/stack`](../../deploy/sqlalchemy/stack).
2. После **35** — [`interview-cheatsheet.md`](interview-cheatsheet.md).
3. [36-capstone.md](36-capstone.md) — **5–7 часов**.

**Время:** ~50–65 мин на пару «теория + лаба»; **~22–28 часов** total.

## Программа (36 уроков)

### Фаза 1. Core и Engine (01–06)
| 01 | [Ландшафт: Core vs ORM, 1.x vs 2.0](01-landscape-core-orm.md) |
| 02 | [Engine, Connection, text(), Result](02-engine-connection.md) |
| 03 | [Лаба: explore стенд + psql](03-lab-explore-stack.md) |
| 04 | [MetaData, Table, Core INSERT/UPDATE](04-metadata-core-crud.md) |
| 05 | [Лаба: Core CRUD без ORM](05-lab-core-crud.md) |
| 06 | [select(), where(), join() — SQL Expression](06-core-select-expressions.md) |

### Фаза 2. ORM Declarative sync (07–12)
| 07 | [DeclarativeBase, Mapped, mapped_column](07-declarative-models.md) |
| 08 | [Лаба: models Category Product](08-lab-declarative-models.md) |
| 09 | [Session: add, flush, commit, rollback](09-session-lifecycle.md) |
| 10 | [Лаба: sync Session CRUD](10-lab-sync-session.md) |
| 11 | [ORM queries: select(Model), scalars, where](11-orm-select-20-style.md) |
| 12 | [Лаба: фильтры, order_by, limit](12-lab-orm-queries.md) |

### Фаза 3. Relationships (13–18)
| 13 | [relationship, back_populates, lazy](13-relationships-basics.md) |
| 14 | [Лаба: Product → Category FK](14-lab-fk-relationship.md) |
| 15 | [joinedload, selectinload, subqueryload](15-eager-loading.md) |
| 16 | [Лаба: fix N+1 + EXPLAIN](16-lab-n-plus-one.md) |
| 17 | [Many-to-many, association table](17-many-to-many.md) |
| 18 | [Лаба: Product tags M2M](18-lab-tags-m2m.md) |

### Фаза 4. Async SQLAlchemy (19–24)
| 19 | [create_async_engine, AsyncSession](19-async-engine-session.md) |
| 20 | [Лаба: async setup + queries](20-lab-async-crud.md) |
| 21 | [asyncpg, greenlet, run_sync](21-async-patterns.md) |
| 22 | [Лаба: async repository](22-lab-async-repository.md) |
| 23 | [Sync vs async: когда что](23-sync-vs-async-orm.md) |
| 24 | [Лаба: dual engine smoke](24-lab-dual-engine.md) |

### Фаза 5. Alembic и transactions (25–30)
| 25 | [Alembic: env.py, autogenerate](25-alembic-intro.md) |
| 26 | [Лаба: migration add column](26-lab-alembic-migrate.md) |
| 27 | [Transactions, isolation, savepoints](27-transactions-isolation.md) |
| 28 | [Лаба: order + items atomic](28-lab-transaction-order.md) |
| 29 | [Raw SQL, text(), hybrid queries](29-raw-sql-hybrid.md) |
| 30 | [Лаба: reporting query](30-lab-reporting-sql.md) |

### Фаза 6. Production (31–36)
| 31 | [Repository pattern, Unit of Work](31-repository-uow.md) |
| 32 | [Лаба: ProductRepository](32-lab-repository.md) |
| 33 | [Pool, pre_ping, testing ORM](33-pool-testing.md) |
| 34 | [Лаба: pytest + test DB](34-lab-pytest-db.md) |
| 35 | [Interview Q&A (топ-40)](35-interview-qa.md) |
| 36 | [Capstone: Shop data layer](36-capstone.md) |

| — | [Interview cheatsheet](interview-cheatsheet.md) |

## Что должно получиться

- Пишете **Core** и **ORM 2.0** запросы уверенно.
- Проектируете **models**, **relationships**, **M2M**.
- Чините **N+1** через eager loading.
- Работаете с **async SQLAlchemy** и **Alembic**.
- Тестируете data layer без хрупких моков.

## Связь с курсами

| Курс | Связь |
|------|-------|
| [`postgresql-basic`](../postgresql-basic/README.md) | SQL, EXPLAIN, indexes |
| [`postgresql-developer`](../postgresql-developer/README.md) | migrations theory |
| [`fastapi`](../fastapi/README.md) | DI + AsyncSession in API |
| [`django`](../django/README.md) | ORM comparison |
| [`python-testing`](../python-testing/README.md) | pytest fixtures |

## Эталонный код

[`deploy/sqlalchemy/stack/shop`](../../deploy/sqlalchemy/stack/shop) — models, db.py, alembic.
