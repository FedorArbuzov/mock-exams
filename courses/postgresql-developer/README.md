# PostgreSQL — Developer (специализация)

Курс для **backend / fullstack**: версионирование схемы, паттерны запросов, **JSONB**, **full-text search**, **advisory locks**, очереди на `SKIP LOCKED`, CI миграций.

Формат — **мегакурс**: сценарии с работы, антипаттерны, лабы с troubleshooting, связи с FastAPI, Django, SQLAlchemy.

## Кому подходит

- Backend-разработчики на Postgres (не только DBA)
- Инженеры, внедряющие Flyway/Liquibase в CI
- Те, кто проектирует catalog search и job queues без Redis

## Предварительно

| Курс | Зачем |
|------|-------|
| [`postgresql-basic`](../postgresql-basic/README.md) | 03–06 DDL, roles, indexes |
| [`sqlalchemy-deep`](../sqlalchemy-deep/README.md) | N+1, pool, transactions |
| [`fastapi`](../fastapi/README.md) / [`django`](../django/README.md) | ORM, Alembic/migrations |

**Локально:** [`deploy/postgres`](../../deploy/postgres/README.md) + [Flyway CLI](https://flywaydb.org/download).

## Программа

| # | Урок | Тип |
|---|------|-----|
| 1 | [Обзор миграций](01-migrations-overview.md) | теория |
| 2 | [Flyway](02-flyway.md) | теория |
| 3 | [Лаба: Flyway](03-lab-flyway.md) | лаба |
| 4 | [Liquibase](04-liquibase.md) | теория |
| 5 | [Лаба: Liquibase](05-lab-liquibase.md) | лаба |
| 6 | [N+1 и паттерны запросов](06-n-plus-one.md) | теория |
| 7 | [Лаба: N+1](07-lab-n-plus-one.md) | лаба |
| 8 | [JSONB](08-jsonb.md) | теория |
| 9 | [Лаба: JSONB](09-lab-jsonb.md) | лаба |
| 10 | [Full-text search](10-full-text-search.md) | теория |
| 11 | [Лаба: FTS](11-lab-fts.md) | лаба |
| 12 | [Advisory locks и очереди](12-advisory-locks.md) | теория |
| 13 | [Лаба: worker + SKIP LOCKED](13-lab-advisory-locks.md) | лаба |
| 14 | [Миграции в GitLab CI](14-ci-migrations.md) | теория |
| 15 | [Финальный проект: схема заказов](15-final-project.md) | проект |

## Примеры

| Файл | Урок |
|------|------|
| [`examples/flyway/`](examples/flyway/) | 02–03, 15 |
| [`examples/liquibase/`](examples/liquibase/) | 04–05, 12–13 |
| [`examples/gitlab-migrate.yml`](examples/gitlab-migrate.yml) | 14 |

## Что должно получиться

После курса вы:

- Версионируете схему через Flyway (и понимаете Liquibase)
- Избегаете N+1; пишете JOIN / eager loading осознанно
- Индексируете JSONB и FTS; используете pg_trgm
- Реализуете очередь на `FOR UPDATE SKIP LOCKED`
- Встраиваете `flyway migrate` в GitLab CI

## Связанные треки

```text
postgresql-basic → postgresql-developer (этот курс)
                 → postgresql-performance (тюнинг запросов)
                 → postgresql-security (RLS, roles)
```

Карта ветки: [`postgresql-path.md`](../postgresql-path.md).
