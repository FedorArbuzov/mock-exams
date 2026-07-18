# PostgreSQL — Ops (специализация)

Курс для **DBA on-call / DevOps**: физические бэкапы, **pgBackRest**, **WAL-G**, **blue/green**, zero-downtime cutover, runbook’и.

**Формат:** мегакурс (~90–120 строк на урок). План: [`postgresql-path.md`](../postgresql-path.md).

**Предварительно:** [`postgresql-intermediate`](../postgresql-intermediate/README.md) (WAL, PITR, replication).

**Локально:** [`deploy/postgres`](../../deploy/postgres/README.md); MinIO — [`docker-compose.ops.yml`](../../deploy/postgres/docker-compose.ops.yml).

## Программа

1. [Ландшафт бэкапов](01-backup-landscape.md)
2. [pgBackRest](02-pgbackrest.md)
3. [Лаба: pgBackRest](03-lab-pgbackrest.md)
4. [WAL-G](04-wal-g.md)
5. [Лаба: WAL-G](05-lab-wal-g.md)
6. [Blue/green](06-blue-green.md)
7. [Лаба: blue/green](07-lab-blue-green.md)
8. [Zero-downtime](08-zero-downtime.md)
9. [Лаба: cutover](09-lab-cutover.md)
10. [On-call runbooks](10-oncall-runbooks.md)
11. [Лаба: инцидент](11-lab-incident.md)
12. [Мониторинг для ops](12-monitoring-ops.md)
13. [Финальный проект: Ops Playbook](13-final-project.md)

## Что должно получиться

- Выбираете инструмент бэкапа под RPO/RTO.
- Описываете blue/green cutover и runbook на lag/disk full.
- Связываете алерты с действиями on-call.
