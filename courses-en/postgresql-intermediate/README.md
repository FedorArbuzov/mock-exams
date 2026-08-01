# PostgreSQL — Intermediate (administration)

Intermediate level: **configuration**, **WAL**, **replication**, **PITR**, **autovacuum**, **monitoring**, **PgBouncer**.

**Format:** mega-course (~150–220 lines per lesson) — real-world scenarios, runbook labs, links to ops/advanced. Track plan: [`postgresql-path.md`](../postgresql-path.md).

**Prerequisites:** [`postgresql-basic`](../postgresql-basic/README.md).

**Locally:** [`deploy/postgres`](../../deploy/postgres/README.md) + a second replica (labs 05–06).

## Curriculum

1. [postgresql.conf and parameters](01-configuration.md)
2. [Lab: memory and checkpoints](02-lab-configuration.md)
3. [WAL and durability](03-wal.md)
4. [Lab: WAL and a crash](04-lab-wal.md)
5. [Streaming replication](05-streaming-replication.md)
6. [Lab: physical replica](06-lab-streaming-replication.md)
7. [Logical replication](07-logical-replication.md)
8. [Lab: logical pub/sub](08-lab-logical-replication.md)
9. [PITR and pg_basebackup](09-pitr.md)
10. [Lab: point-in-time recovery](10-lab-pitr.md)
11. [VACUUM, bloat, autovacuum](11-vacuum-bloat.md)
12. [Lab: bloat and autovacuum tuning](12-lab-vacuum.md)
13. [Monitoring and slow queries](13-monitoring.md)
14. [Lab: pg_stat_statements](14-lab-monitoring.md)
15. [PgBouncer and connection pooling](15-pgbouncer.md)
16. [Lab: pool in front of Postgres](16-lab-pgbouncer.md)
17. [Final project: HA-ready environment](17-final-project.md)

## Specializations (after intermediate)

| Course | Topic |
|---|---|
| [`postgresql-performance`](../postgresql-performance/README.md) | tuning, pgbench |
| [`postgresql-ops`](../postgresql-ops/README.md) | pgBackRest, blue/green |
| [`postgresql-security`](../postgresql-security/README.md) | pgaudit, compliance |

## What you should end up with

- Configure primary + standby and check lag.
- Perform PITR into a test database.
- Read pg_stat_statements and find top queries.
- Put PgBouncer in front of an application.
