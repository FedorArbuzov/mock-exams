# PostgreSQL — Ops (specialization)

Course for **DBA on-call / DevOps**: physical backups, **pgBackRest**, **WAL-G**, **blue/green**, zero-downtime cutover, runbooks.

**Format:** megacourse (~90–120 lines per lesson). Plan: [`postgresql-path.md`](../postgresql-path.md).

**Prerequisites:** [`postgresql-intermediate`](../postgresql-intermediate/README.md) (WAL, PITR, replication).

**Locally:** [`deploy/postgres`](../../deploy/postgres/README.md); MinIO — [`docker-compose.ops.yml`](../../deploy/postgres/docker-compose.ops.yml).

## Curriculum

1. [Backup landscape](01-backup-landscape.md)
2. [pgBackRest](02-pgbackrest.md)
3. [Lab: pgBackRest](03-lab-pgbackrest.md)
4. [WAL-G](04-wal-g.md)
5. [Lab: WAL-G](05-lab-wal-g.md)
6. [Blue/green](06-blue-green.md)
7. [Lab: blue/green](07-lab-blue-green.md)
8. [Zero-downtime](08-zero-downtime.md)
9. [Lab: cutover](09-lab-cutover.md)
10. [On-call runbooks](10-oncall-runbooks.md)
11. [Lab: incident](11-lab-incident.md)
12. [Monitoring for ops](12-monitoring-ops.md)
13. [Final project: Ops Playbook](13-final-project.md)

## What you should end up with

- You choose a backup tool based on RPO/RTO.
- You describe a blue/green cutover and a runbook for lag/disk full.
- You link alerts to on-call actions.
