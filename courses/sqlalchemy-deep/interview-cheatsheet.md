# Interview cheatsheet — SQLAlchemy 2.0

## Quick map

| Topic | Key phrase |
|-------|------------|
| Core | Table, MetaData, insert/select |
| ORM | Mapped, mapped_column, Session |
| 2.0 query | `session.scalars(select(Model))` |
| N+1 | lazy select in loop |
| joinedload | FK eager JOIN |
| selectinload | collection eager IN |
| flush | SQL without commit |
| Alembic | versioned migrations |
| AsyncSession | await execute/scalars |
| asyncpg | async PG driver |
| pool_pre_ping | stale connection check |
| with_for_update | row lock |

## Commands

```bash
alembic upgrade head
alembic revision --autogenerate -m "msg"
docker exec mock-sqlalchemy-lab python lab_cli.py migrate
psql postgresql://course:course@localhost:5433/shop
```

## Stenд

| Resource | Value |
|----------|-------|
| Postgres | localhost:**5433** / db **shop** |
| Sync DSN | `postgresql+psycopg://course:course@localhost:5433/shop` |
| Async DSN | `postgresql+asyncpg://course:course@localhost:5433/shop` |

## Debug N+1

```python
select(Model).options(joinedload(Model.parent)).  # + .unique() if joined collection parent
```

## Session rules

- One session per request / UoW
- commit once at end
- don't hold transaction during HTTP calls

Полные ответы: [35-interview-qa](35-interview-qa.md).
