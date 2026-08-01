# 05. auto_explain and the slow query log

## Scenario from work

`pg_stat_statements` shows that query X takes 40% of `total_exec_time`. You reproduce it in psql — 50ms. On prod at 3 AM — 8 seconds. Without **the plan at the moment of degradation** you're guessing. **auto_explain** logs the `EXPLAIN` for slow executions; `log_min_duration_statement` logs the SQL text.

Three tools — one investigation chain ([intermediate/13-monitoring](../postgresql-intermediate/13-monitoring.md)).

## What you'll learn

- `log_min_duration_statement` in Docker and prod
- `auto_explain` in a session and via preload
- Workflow: pg_stat_statements → reproduce → EXPLAIN
- Risks of `log_analyze` on production

## log_min_duration_statement

On the environment it's often already in compose:

```ini
log_min_duration_statement = 500   # milliseconds
```

```sql
SHOW log_min_duration_statement;
```

Logs:

```bash
docker logs mock-postgres 2>&1 | tail -50
```

Format (depends on `log_line_prefix`):

```text
2026-06-25 10:00:00 UTC [12345]: duration: 612.345 ms  statement: SELECT ...
```

| Threshold | When |
|-------|-------|
| 500ms | Starting point for OLTP |
| 100ms | Noisy on a busy API |
| 0 | All queries — debug only on the environment |

Correlate with `pg_stat_activity.pid` via `%p` in the prefix.

## auto_explain

Logs the **plan** of slow queries automatically.

**In a session (lab):**

```sql
LOAD 'auto_explain';
SET auto_explain.log_min_duration = '200ms';
SET auto_explain.log_analyze = on;
SET auto_explain.log_buffers = on;
SET auto_explain.log_verbose = off;
```

**Permanently (postgresql.conf):**

```ini
shared_preload_libraries = 'pg_stat_statements, auto_explain'
auto_explain.log_min_duration = 500ms
auto_explain.log_analyze = on
auto_explain.log_buffers = on
auto_explain.log_nested_statements = on
```

Requires a **restart** for preload.

| Option | Meaning |
|-------|-------|
| `log_analyze` | Actually executes — **double cost** on prod |
| `log_buffers` | Buffers in the plan |
| `log_triggers` | Trigger timing |
| `sample_rate` | Fraction of queries (noise reduction) |

## Chaining the tools

```text
1. pg_stat_statements → top query by total_exec_time
2. Normalized text → reproduce with parameters
3. EXPLAIN (ANALYZE, BUFFERS) in staging
4. auto_explain in prod → plan at real degradation (no manual reproduce)
5. log_min_duration → exact SQL with literals/timestamps
```

| Tool | Gives you |
|------------|------|
| `pg_stat_statements` | Aggregate, calls, mean, total |
| `log_min_duration_statement` | Text of a specific slow run |
| `auto_explain` | Plan of that same run |

## Risks on production

| Risk | Mitigation |
|------|-----------|
| `log_analyze = on` | Query runs twice; sample_rate; staging only |
| Log volume | Threshold 500ms–1s; central log retention |
| PII in the statement log | `log_statement` off for everything; masking |

For prod, often: `log_analyze = off` in auto_explain, plan estimates only; full ANALYZE in staging.

## Common mistakes

1. Enabling auto_explain with a 1ms threshold on prod — log disk fills up.
2. Looking for the plan only in pg_stat_statements — it's not there.
3. Forgetting `shared_preload_libraries` — LOAD works per session only.
4. Not checking docker logs / journal when things are "slow".

## Checklist

- [ ] auto_explain vs manual EXPLAIN
- [ ] Risk of `log_analyze = on`
- [ ] Where the logs are in Docker
- [ ] The 4-step investigation workflow
- [ ] log_min_duration threshold for your SLA

## Next

Lab: [06-lab-auto-explain.md](06-lab-auto-explain.md).
