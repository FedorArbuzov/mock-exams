# PostgreSQL — Intermediate (администрирование)

Средний уровень: **конфигурация**, **WAL**, **репликация**, **PITR**, **autovacuum**, **мониторинг**, **PgBouncer**.

**Формат:** мегакурс (~150–220 строк на урок) — сценарии с работы, runbook-лабы, связи с ops/advanced. План ветки: [`postgresql-path.md`](../postgresql-path.md).

**Предварительно:** [`postgresql-basic`](../postgresql-basic/README.md).

**Локально:** [`deploy/postgres`](../../deploy/postgres/README.md) + вторая реплика (лабы 05–06).

## Программа

1. [postgresql.conf и параметры](01-configuration.md)
2. [Лаба: memory и checkpoints](02-lab-configuration.md)
3. [WAL и durability](03-wal.md)
4. [Лаба: WAL и сбой](04-lab-wal.md)
5. [Streaming replication](05-streaming-replication.md)
6. [Лаба: physical replica](06-lab-streaming-replication.md)
7. [Logical replication](07-logical-replication.md)
8. [Лаба: logical pub/sub](08-lab-logical-replication.md)
9. [PITR и pg_basebackup](09-pitr.md)
10. [Лаба: восстановление на время](10-lab-pitr.md)
11. [VACUUM, bloat, autovacuum](11-vacuum-bloat.md)
12. [Лаба: bloat и tuning autovacuum](12-lab-vacuum.md)
13. [Мониторинг и slow queries](13-monitoring.md)
14. [Лаба: pg_stat_statements](14-lab-monitoring.md)
15. [PgBouncer и connection pooling](15-pgbouncer.md)
16. [Лаба: pool перед Postgres](16-lab-pgbouncer.md)
17. [Финальный проект: HA-ready стенд](17-final-project.md)

## Специализации (после intermediate)

| Курс | Тема |
|---|---|
| [`postgresql-performance`](../postgresql-performance/README.md) | tuning, pgbench |
| [`postgresql-ops`](../postgresql-ops/README.md) | pgBackRest, blue/green |
| [`postgresql-security`](../postgresql-security/README.md) | pgaudit, compliance |

## Что должно получиться

- Настраиваете primary + standby, проверяете lag.
- Делаете PITR в тестовую БД.
- Читаете pg_stat_statements и находите top queries.
- Ставите PgBouncer перед приложением.
