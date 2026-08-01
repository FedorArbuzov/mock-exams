# 13. Monitoring and slow queries

## Real-world scenario

Grafana is green, users are yelling. Postgres CPU is at 90%, but **which** query? `pg_stat_activity` shows `idle in transaction` since 09:00. `pg_stat_statements` — a single JOIN with a `mean_exec_time` of 4 seconds and 50k calls. A third layer: `seq_scan` on `orders` grew after a release — a regression in [pg_stat_user_tables](https://www.postgresql.org/docs/current/monitoring-stats.html).

Intermediate closes out Postgres **observability** before Prometheus/Grafana ([observability-basic](../observability-basic/README.md)).

## What you'll learn

- `pg_stat_activity` — who, what, how much it's waiting
- `pg_stat_statements` — an aggregate over normalized queries
- Other `pg_stat_*` for tables, indexes, replication
- Alerts and logs
- Distinguishing symptoms from tools

## pg_stat_activity — right now

```sql
SELECT pid, usename, application_name, state,
       wait_event_type, wait_event,
       now() - query_start AS query_age,
       now() - state_change AS state_age,
       left(query, 100) AS query
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid()
ORDER BY query_start NULLS LAST;
```

| state | Action |
|-------|----------|
| `active` | Running — look at `wait_event`, `query` |
| `idle` | Waiting for the client — OK |
| `idle in transaction` | **Dangerous** — find the app, `pg_terminate_backend` after a grace period |
| `idle in transaction (aborted)` | After an error in a txn — a bug in the app |

| wait_event_type | Examples |
|-----------------|---------|
| `Lock` | Blocked by another backend |
| `IO` | DataFileRead |
| `Client` | ClientRead — waiting for the client |

Long active + `Lock` → [12-lab-mvcc](../postgresql-basic/12-lab-mvcc.md), `pg_locks`.

## pg_stat_statements

An extension on the environment ([deploy/postgres](../../deploy/postgres/README.md)):

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT left(query, 80) AS q,
       calls,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       round(total_exec_time::numeric, 2) AS total_ms,
       rows
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
ORDER BY total_exec_time DESC
LIMIT 15;
```

| Metric | Meaning |
|---------|-------|
| `mean_exec_time` | Average — outlier queries |
| `total_exec_time` | calls × mean — the main load culprit |
| `stddev_exec_time` | Instability |

Requires `shared_preload_libraries = 'pg_stat_statements'` in `postgresql.conf` (usually already there in the compose environment).

Resetting the statistics (be careful):

```sql
SELECT pg_stat_statements_reset();
```

## Other views

| View | What to look at |
|------|--------------|
| `pg_stat_user_tables` | `seq_scan` vs `idx_scan`, `n_tup_ins/upd/del`, dead tuples |
| `pg_stat_user_indexes` | `idx_scan = 0` — a dead index |
| `pg_stat_database` | `xact_commit`, `deadlocks`, `temp_files` |
| `pg_stat_replication` | lag on the primary |
| `pg_stat_subscription` | logical replication |

A regression after a release:

```sql
SELECT relname, seq_scan, idx_scan, n_tup_ins
FROM pg_stat_user_tables
WHERE schemaname = 'shop'
ORDER BY seq_scan DESC;
```

Growing `seq_scan` on a large table — no index or a stale `ANALYZE`.

## Exporting to Prometheus

**postgres_exporter** — metrics for connections, replication lag, bloat proxies, database size. Dashboards in [observability](../observability-basic/README.md).

Minimal alerts:

- `connections` > 80% of `max_connections`
- `replication lag` > threshold (bytes or seconds)
- disk usage of PGDATA > 85%
- `age(datfrozenxid)` close to the limit
- any `idle in transaction` > 5 min
- `pg_stat_archiver failed_count` > 0

## Logs

`log_min_duration_statement` ([01-configuration](01-configuration.md)) + central collection. Correlate by `pg_stat_activity.pid` and `log_line_prefix '%p'`.

## pg_stat_activity vs pg_stat_statements

| | activity | statements |
|---|----------|------------|
| Horizon | Right now | History since the reset |
| Use case | Lock, stuck query | Top offenders, regressions |
| Overhead | Low | Low with reasonable tracking |

## Common mistakes

1. Killing a random backend without checking `application_name`.
2. Looking only at mean, ignoring total_exec_time.
3. Not resetting / not accounting for the deploy when comparing "before/after."
4. Alerting only on CPU, not on lag and archiver.

## Checklist

- [ ] Action on `idle in transaction`
- [ ] seq_scan grows — 3 checks (index, analyze, plan)
- [ ] activity vs statements
- [ ] idx_scan = 0 — not the only criterion for dropping an index
- [ ] 5 alerts for production Postgres

## Next

Lab: [14-lab-monitoring.md](14-lab-monitoring.md).
