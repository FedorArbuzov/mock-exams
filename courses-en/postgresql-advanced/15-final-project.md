# 15. Final project: DBA Playbook

## Real-world scenario

Three PostgreSQL courses (basic → intermediate → advanced) — dozens of labs and runbooks. In production you need **one** document: "how we operate Postgres for the shop API". This project pulls together architecture, daily checks, failover, upgrade, security, and on-call into `docs/postgres-dba-playbook/`.

This is the capstone of **advanced** and the whole admin track (~47 lessons).

## Goal

A single operational playbook for PostgreSQL on the mock-exams platform: self-hosted, RDS, or CNPG — pick one scenario and describe it end to end.

## Prerequisites

- [intermediate/17-final-project](../postgresql-intermediate/17-final-project.md) — HA-ready docs (can be merged in)
- Labs: Patroni [02](02-lab-patroni.md), PITR [intermediate/10](../postgresql-intermediate/10-lab-pitr.md), upgrade [10](10-lab-upgrade.md), incident [12](12-lab-troubleshooting.md)

## Submission structure

```text
docs/postgres-dba-playbook/
├── README.md                 — table of contents, owner, review date
├── 01-architecture.md
├── 02-daily-checks.md
├── 03-backup-restore.md
├── 04-failover.md
├── 05-major-upgrade.md       — link to the pg-upgrade doc
├── 06-security.md
├── 07-incidents/
│   ├── blocking-migration.md
│   ├── disk-full-pg-wal.md
│   └── replication-lag.md
├── 08-oncall-cheatsheet.md
└── 09-app-integration.md
```

## Section 1: Architecture

- Diagram: app → PgBouncer → primary (+ replica / RDS Multi-AZ / CNPG)
- PG version, region, RPO/RTO
- Links to [01-patroni-ha](01-patroni-ha.md) or [13-cloud-k8s](13-cloud-k8s.md)

## Section 2: Daily checks

SQL + thresholds (a DBA's morning):

| Check | Query / metric | Threshold |
|----------|------------------|-------|
| Connections | `count(*)` activity / max | < 80% |
| Replication lag | `pg_stat_replication` | < 100MB or 30s |
| Dead tuples top | `pg_stat_user_tables` | dead_ratio < 0.2 |
| Disk PGDATA | node exporter | < 85% |
| Archiver | `pg_stat_archiver.failed_count` | 0 |
| Long idle txn | activity `idle in transaction` | 0 > 5min |
| Backup last success | cron / pgBackRest | < 24h |

## Section 3: Backup / restore

- Nightly `pg_dump -Fc` scope
- WAL archive / RDS snapshots
- Link to the PITR runbook ([intermediate/10](../postgresql-intermediate/10-lab-pitr.md))
- Quarterly restore test calendar

## Section 4: Failover

- Patroni: `patronictl failover` outline **or** RDS Multi-AZ **or** CNPG switchover
- DNS / connection string change
- Post-failover: rebuild the old primary as a replica

## Section 5: Major upgrade

Insert or link to [10-lab-upgrade](10-lab-upgrade.md) `pg-upgrade-16-to-17.md`.

## Section 6: Security

Role matrix ([basic/05-roles](../postgresql-basic/05-roles-privileges.md))  
RLS tenant ([08-lab-security](08-lab-security.md))  
TLS `verify-full`  
Link to the [postgresql-security](../postgresql-security/README.md) roadmap

## Section 7: Incidents

Three templates from the labs — with **at least one** real one filled in from [12-lab-troubleshooting](12-lab-troubleshooting.md):

- Timeline, impact, root cause, resolution, prevention

The other two — a skeleton with commands.

## Section 8: On-call cheatsheet

**15 commands** to copy-paste, each with a one-liner "when":

1. blocked/blocking query ([11-troubleshooting](11-troubleshooting.md))
2. top pg_stat_statements
3. replication lag
4. terminate idle in transaction
5. pg_database_size
6. pg_stat_archiver
7. replication slots retained WAL
8. cancel long query
9. list locks on table
10. check `pg_is_in_recovery`
11. connection count by app
12. last autovacuum table
13. checkpoint log grep hint
14. failover DNS step
15. emergency read-only mode (if applicable)

## Section 9: App integration

- `DATABASE_URL` example (pooler port 6432)
- Pool size formula: `pods × pool_size < max_connections`
- Migrations: GitLab CI, Flyway ([developer/02-flyway](../postgresql-developer/02-flyway.md))
- `SET app.tenant_id` for RLS
- Health check: `SELECT 1` vs checking replica lag for the read path

## Integration with the mock-exams courses

| Course | Link |
|------|-------|
| [fastapi](../fastapi/README.md) | SQLAlchemy pool, deploy :8090 |
| [gitlab-intermediate](../gitlab-intermediate/README.md) | CI migrate job |
| [kuber-advanced](../kuber-advanced/README.md) | postgres_exporter |
| [postgresql-ops](../postgresql-ops/README.md) | pgBackRest deep dive |

## Submission

- Git repo / folder with the playbook
- **One** postmortem from a simulated incident ([12](12-lab-troubleshooting.md))
- README with a review date (quarterly)

## Grading criteria

| Level | Criteria |
|---------|----------|
| Pass | 9 sections, on-call 15 commands, 1 postmortem |
| Strong | Daily checks are automatable; failover tested or tabletop ≥ 15 steps |
| Gap | Only a table of contents without SQL |

## Self-check

- [ ] A new DBA can find PITR in 2 minutes
- [ ] The failover path matches the architecture diagram
- [ ] Security isn't "we use Postgres"
- [ ] The app team knows the pool size and the migration window

## Next

Specializations:

- [postgresql-security](../postgresql-security/README.md)
- [postgresql-performance](../postgresql-performance/README.md)
- [postgresql-ops](../postgresql-ops/README.md)
- [postgresql-developer](../postgresql-developer/README.md)

---

**postgresql-advanced complete.**

Full admin track: **basic → intermediate → advanced** (47 lessons).
