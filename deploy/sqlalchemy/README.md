# SQLAlchemy для курса sqlalchemy-deep

PostgreSQL **5433** + Python lab container с ORM-моделями, Alembic, sync/async engines.

Курс: [sqlalchemy-deep](../../courses/sqlalchemy-deep/README.md).

## Запуск

```bash
cd deploy/sqlalchemy
docker compose up -d --build
docker compose ps
```

| Сервис | Подключение |
|--------|-------------|
| PostgreSQL (с хоста) | `postgresql://course:course@localhost:5433/shop` |
| PostgreSQL (из lab) | `postgresql+psycopg://course:course@postgres:5432/shop` |
| Async DSN | `postgresql+asyncpg://course:course@postgres:5432/shop` |

**Note:** порт **5433** — чтобы не конфликтовать с [`deploy/postgres`](../postgres/README.md) (`5432`).

## Smoke

```bash
bash scripts/smoke.sh
powershell -File scripts/smoke.ps1
```

## Lab shell

```bash
docker exec -it mock-sqlalchemy-lab bash
python lab_cli.py migrate
python lab_cli.py seed
python -m pytest tests/ -v
```

## Alembic

```bash
docker exec mock-sqlalchemy-lab alembic upgrade head
docker exec mock-sqlalchemy-lab alembic revision --autogenerate -m "describe change"
```

## psql

```bash
docker exec -it mock-sqlalchemy-postgres psql -U course -d shop
```

## Сброс

```bash
docker compose down -v
```

## Связанные курсы

- [postgresql-basic](../../courses/postgresql-basic/README.md) — SQL под ORM
- [postgresql-developer](../../courses/postgresql-developer/README.md) — миграции
- [fastapi/13](../../courses/fastapi/13-sqlalchemy-async.md) — async в API
- [django/07](../../courses/django/07-models-basics.md) — Django ORM contrast
