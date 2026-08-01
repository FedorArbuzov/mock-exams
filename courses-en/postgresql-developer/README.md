# PostgreSQL — Developer (specialization)

Course for **backend / fullstack**: schema versioning, query patterns, **JSONB**, **full-text search**, **advisory locks**, queues with `SKIP LOCKED`, migration CI.

Format — **megacourse**: real-world scenarios, antipatterns, labs with troubleshooting, links to FastAPI, Django, SQLAlchemy.

## Who it's for

- Backend developers on Postgres (not only DBAs)
- Engineers adopting Flyway/Liquibase in CI
- Anyone designing catalog search and job queues without Redis

## Prerequisites

| Course | Why |
|------|-------|
| [`postgresql-basic`](../postgresql-basic/README.md) | 03–06 DDL, roles, indexes |
| [`sqlalchemy-deep`](../sqlalchemy-deep/README.md) | N+1, pool, transactions |
| [`fastapi`](../fastapi/README.md) / [`django`](../django/README.md) | ORM, Alembic/migrations |

**Locally:** [`deploy/postgres`](../../deploy/postgres/README.md) + [Flyway CLI](https://flywaydb.org/download).

## Curriculum

| # | Lesson | Type |
|---|------|-----|
| 1 | [Migrations overview](01-migrations-overview.md) | theory |
| 2 | [Flyway](02-flyway.md) | theory |
| 3 | [Lab: Flyway](03-lab-flyway.md) | lab |
| 4 | [Liquibase](04-liquibase.md) | theory |
| 5 | [Lab: Liquibase](05-lab-liquibase.md) | lab |
| 6 | [N+1 and query patterns](06-n-plus-one.md) | theory |
| 7 | [Lab: N+1](07-lab-n-plus-one.md) | lab |
| 8 | [JSONB](08-jsonb.md) | theory |
| 9 | [Lab: JSONB](09-lab-jsonb.md) | lab |
| 10 | [Full-text search](10-full-text-search.md) | theory |
| 11 | [Lab: FTS](11-lab-fts.md) | lab |
| 12 | [Advisory locks and queues](12-advisory-locks.md) | theory |
| 13 | [Lab: worker + SKIP LOCKED](13-lab-advisory-locks.md) | lab |
| 14 | [Migrations in GitLab CI](14-ci-migrations.md) | theory |
| 15 | [Final project: orders schema](15-final-project.md) | project |

## Examples

| File | Lesson |
|------|------|
| [`examples/flyway/`](examples/flyway/) | 02–03, 15 |
| [`examples/liquibase/`](examples/liquibase/) | 04–05, 12–13 |
| [`examples/gitlab-migrate.yml`](examples/gitlab-migrate.yml) | 14 |

## What you should end up with

After the course you will:

- Version the schema with Flyway (and understand Liquibase)
- Avoid N+1; write JOIN / eager loading deliberately
- Index JSONB and FTS; use pg_trgm
- Implement a queue with `FOR UPDATE SKIP LOCKED`
- Wire `flyway migrate` into GitLab CI

## Related tracks

```text
postgresql-basic → postgresql-developer (this course)
                 → postgresql-performance (query tuning)
                 → postgresql-security (RLS, roles)
```

Branch map: [`postgresql-path.md`](../postgresql-path.md).
