# 07. Lab: pgaudit

## Why this lab

See **real AUDIT lines** in the logs after DDL and role changes — the very thing security reads during an incident.

## Prerequisites

- [`deploy/postgres`](../../deploy/postgres/README.md) with pgaudit
- [06-pgaudit](06-pgaudit.md)

## Task 1. Check preload

```sql
SHOW shared_preload_libraries;
CREATE EXTENSION IF NOT EXISTS pgaudit;
SHOW pgaudit.log;
```

If `pgaudit` isn't in preload — rebuild/restart the environment per the deploy README.

Expected: `shared_preload_libraries` contains `pgaudit`.

## Task 2. Configure classes

```sql
ALTER SYSTEM SET pgaudit.log = 'ddl, role';
ALTER SYSTEM SET pgaudit.log_relation = on;
SELECT pg_reload_conf();
SHOW pgaudit.log;
```

## Task 3. DDL audit trail

```sql
CREATE SCHEMA IF NOT EXISTS sec;
CREATE TABLE sec.audit_test (id int);
ALTER TABLE sec.audit_test ADD COLUMN note text;
DROP TABLE sec.audit_test;
```

## Task 4. Role audit trail

```sql
CREATE ROLE audit_demo LOGIN PASSWORD 'AuditDemo2024!';
GRANT CONNECT ON DATABASE course TO audit_demo;
DROP ROLE audit_demo;
```

## Task 5. Reading logs

```bash
docker logs mock-postgres 2>&1 | grep -i AUDIT | tail -20
```

Alternative (if the log is in a file):

```bash
docker exec mock-postgres tail -50 /var/lib/postgresql/data/log/postgresql-*.log | grep AUDIT
```

**Record** one full line for `CREATE TABLE sec.audit_test`:

| Field | Value from your log |
|------|-------------------------|
| Timestamp | |
| User@DB | |
| Statement type | |
| Object | |

## Task 6. Prod logging path (tabletop)

Describe it for Kubernetes + CloudNativePG:

| Component | Your answer |
|-----------|-----------|
| Where PG writes | stdout |
| Who collects | Fluent Bit DaemonSet |
| Where to ship | Elasticsearch / Loki |
| Retention | 90 days (example) |
| Alert on DROP | SIEM rule |

## Troubleshooting

| Problem | Cause | Fix |
|----------|---------|-----|
| No AUDIT lines | preload missing | restart with pgaudit |
| Only regular LOG | `pgaudit.log` empty | ALTER SYSTEM + reload |
| grep is empty | Logs in a file, not docker logs | tail the pg log file |
| DDL not visible | Wrong container/cluster | Check `mock-postgres` |

## Success criteria

- [ ] CREATE TABLE visible in the logs with an AUDIT prefix
- [ ] CREATE/DROP ROLE visible
- [ ] Example log line documented
- [ ] Prod path described (stdout → agent → SIEM)

## Next

Encryption: [08-encryption.md](08-encryption.md).
