# 06. pgaudit

## Real-world scenario

An insider deleted 40k rows from `customers` via psql — the application didn't log it. Forensics: "who and when" only from **pgaudit** in the PG log. Compliance (SOC 2, PCI) requires an audit trail for DDL and privileged actions.

pgaudit writes to the **standard PostgreSQL log** — convenient for Fluent Bit → SIEM. It doesn't replace app-level audit (business events), but it catches **all** sessions to the DB.

**Environment:** `shared_preload_libraries = 'pgaudit'` in [`deploy/postgres`](../../deploy/postgres/README.md).

**Related:** [advanced/07-security](../postgresql-advanced/07-security.md), [appsec-fundamentals](../appsec-fundamentals/README.md).

## What you'll learn

- Installation and logging classes
- `pgaudit.log_relation` and `read` noise
- Integration with a SIEM
- pgaudit vs application audit

## Enabling

```sql
CREATE EXTENSION IF NOT EXISTS pgaudit;

ALTER SYSTEM SET pgaudit.log = 'ddl, role';
ALTER SYSTEM SET pgaudit.log_relation = on;
ALTER SYSTEM SET log_line_prefix = '%m [%p] %u@%d ';
SELECT pg_reload_conf();
```

`shared_preload_libraries` requires a **restart** on first enable — check the image before the lab.

Check:

```sql
SHOW shared_preload_libraries;  -- pgaudit
SHOW pgaudit.log;
```

## Classes

| Class | Logs | When to enable |
|-------|----------|----------------|
| `ddl` | CREATE, ALTER, DROP | **Always** in prod |
| `role` | GRANT, CREATE ROLE, DROP ROLE | **Always** |
| `write` | INSERT, UPDATE, DELETE | DML audit, careful with volume |
| `read` | SELECT | Rarely — very noisy |
| `function` | FUNCTION/PROCEDURE calls | As needed |
| `misc` | DISCARD, FETCH, CHECKPOINT | Usually not |

Recommendation for shop:

```sql
ALTER SYSTEM SET pgaudit.log = 'ddl, role, write';
```

`read` — only on sensitive tables via `pgaudit.role` (advanced).

## Example log line

```text
2026-06-25 14:02:11 UTC [12345] course@course AUDIT: SESSION,1,1,DDL,CREATE TABLE,TABLE,sec.audit_test,...
```

Fields: timestamp, PID, user@db, `AUDIT`, class, statement type, object.

## log_relation

```sql
ALTER SYSTEM SET pgaudit.log_relation = on;
```

Logs the **table name** on DML — critical for forensics ("which tables were touched").

## Performance and retention

| Risk | Mitigation |
|------|-----------|
| Disk full from logs | log_rotation, central SIEM |
| I/O on busy OLTP | Don't enable `read` globally |
| PII in logs (VALUES) | `log_statement` off; pgaudit doesn't log row data by default |

Sampling and filters — on the SIEM side (Splunk, ELK).

## pgaudit vs application audit

| | pgaudit | App audit (events table) |
|---|---------|--------------------------|
| Coverage | All clients (psql, ETL, app) | Only app code path |
| Context | SQL-level | Business context (order_id) |
| Bypass | Direct psql | psql bypass |
| Volume | Can be large | Controlled |

**You need both** for multi-tenant SaaS.

## SIEM pipeline

```text
PostgreSQL log (file or stdout)
  → Fluent Bit / Filebeat
    → Elasticsearch / Splunk
      → Alert: DROP TABLE, GRANT SUPERUSER
```

Alerts:

- `DROP` / `TRUNCATE` outside a maintenance window
- `CREATE ROLE` with `SUPERUSER`
- Spike in failed auth (brute force)

## Common mistakes

1. Extension without preload — `pgaudit` doesn't work.
2. `read` on production — TB of logs a day.
3. Logs only in the container without shipping — lost on restart.
4. "We have app audit" — a DBA via psql is invisible.

## Checklist

- [ ] preload + extension
- [ ] Classes ddl, role — minimum
- [ ] log_relation for DML forensics
- [ ] Log path in prod (file/stdout/agent)
- [ ] Retention and SIEM alert rules

## Next

Lab: [07-lab-pgaudit.md](07-lab-pgaudit.md).
