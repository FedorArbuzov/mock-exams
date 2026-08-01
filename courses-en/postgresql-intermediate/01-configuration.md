# 01. postgresql.conf and parameters

## Real-world scenario

After migrating to RDS, a colleague bumped `work_mem` to 256MB "so sorts fly." A week later the nightly report crashed with OOM: 80 parallel queries × 256MB theoretically eat tens of gigabytes. Another case: a DBA edits `postgresql.conf` by hand, and an hour later `ALTER SYSTEM` from Ansible overwrites `postgresql.auto.conf` — nobody understands which value is actually active.

Intermediate starts with **managed configuration**: where the files live, what requires a restart, how not to kill memory, and what to enable in the logs before the first incident.

**Prerequisites:** [postgresql-basic](../postgresql-basic/README.md).  
**Environment:** [`deploy/postgres`](../../deploy/postgres/README.md).

## What you'll learn

- Where Postgres stores its config and how to apply changes
- Memory parameters: `shared_buffers`, `work_mem`, the "× connections" trap
- WAL and checkpoint — the link to replication and durability
- Logging for diagnostics without pg_stat_statements
- `pg_hba.conf` and reload vs restart

## Where the config lives

```sql
SHOW config_file;
SHOW hba_file;
SHOW data_directory;
```

Typical chain:

```text
postgresql.conf          — main file
postgresql.auto.conf       — entries from ALTER SYSTEM (pulled in via include)
pg_hba.conf              — client authentication
pg_ident.conf            — map OS user → DB role (rare)
```

Applying changes:

```sql
ALTER SYSTEM SET shared_buffers = '256MB';
SELECT pg_reload_conf();
```

`ALTER SYSTEM` writes to `postgresql.auto.conf` and survives manual edits of **other** parameters in the same file — but it does not override lines in `postgresql.conf`.

| Method | When |
|--------|-------|
| `ALTER SYSTEM` + `pg_reload_conf()` | Parameter with `context = sighup` or `superuser-backend` |
| Container restart / `pg_ctl restart` | `context = postmaster` — `wal_level`, `max_connections`, `shared_buffers` (often) |
| Edit file + reload | GitOps, cloud-init, Helm values |

Check whether a restart is required:

```sql
SELECT name, setting, pending_restart
FROM pg_settings
WHERE name IN ('shared_buffers', 'wal_level', 'work_mem');
```

## Memory: not the "25% RAM" dogma

| Parameter | Purpose | Rule of thumb |
|----------|------------|----------|
| `shared_buffers` | Cache of data pages in Postgres RAM | 25% RAM as a starting point; on Linux with a large page cache, sometimes less |
| `effective_cache_size` | A hint to the **planner** (not a RAM allocation) | 50–75% RAM — "how much is also in the OS cache" |
| `work_mem` | Sort/hash **per operation** in a query | 4–64MB; multiply by parallel operations and connections |
| `maintenance_work_mem` | VACUUM, CREATE INDEX, ALTER | 256MB–1GB for heavy maintenance |

**The work_mem trap:**

```text
500 connections × work_mem 64MB ≠ "always 32GB"
```

But a single heavy query with 8 hash joins can take several × work_mem. Plus autovacuum workers. Hence [PgBouncer](15-pgbouncer.md) and limiting the pool in the application ([basic/07-connections-psql](../postgresql-basic/07-connections-psql.md)).

Managed Postgres (RDS) doesn't let you change some parameters — see parameter groups in [aws-intermediate](../aws-intermediate/README.md).

## WAL and checkpoint

| Parameter | Meaning |
|----------|-------|
| `wal_level` | `minimal` / `replica` / `logical` — need `replica+` for streaming ([05-streaming-replication](05-streaming-replication.md)) |
| `max_wal_size` | How much WAL to accumulate before a forced checkpoint |
| `checkpoint_timeout` | Max interval between checkpoints |
| `checkpoint_completion_target` | Spread out checkpoint I/O (0.9 — smoother) |
| `synchronous_commit` | `on` — commit after WAL fsync; `off` — risk of losing the last commits on a crash |

```sql
SHOW wal_level;
SHOW max_wal_size;
```

Changing `wal_level` on a running primary with a replica means a **planned window** and a restart.

## Logging — enable it before the incident

```ini
log_min_duration_statement = 500ms
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_line_prefix = '%m [%p] %u@%d '
```

In Docker: `docker logs mock-postgres`. In production — stdout → Loki/CloudWatch ([observability-basic](../observability-basic/README.md)).

`log_min_duration_statement` is not a replacement for [pg_stat_statements](13-monitoring.md), but it catches "suddenly it's 2 seconds" without an extension.

## pg_hba.conf

After editing — reload. Common mistakes:

- a `reject` line above `scram-sha-256` for the network you need;
- forgot `host replication` for the replication user;
- edited the file in a volume, but the container was recreated with a clean PGDATA.

## Common mistakes

1. A huge `shared_buffers` on an 8GB VM "per the textbook for 64GB."
2. `work_mem` shot up — reports and API in one cluster without limits.
3. Changed `wal_level` without a restart and were surprised logical replication didn't work.
4. Several sources of truth: Ansible, manual conf, `ALTER SYSTEM` — no `pg_settings` as the source of truth.

## Checklist

- [ ] `shared_buffers` vs `effective_cache_size` — different roles
- [ ] Why a large `work_mem` is dangerous with many connections
- [ ] `wal_level minimal` — when it's acceptable (standalone, no replica/archive)
- [ ] `ALTER SYSTEM` vs editing `postgresql.conf` in git
- [ ] How to check `pending_restart`

## Next

Lab: [02-lab-configuration.md](02-lab-configuration.md).
