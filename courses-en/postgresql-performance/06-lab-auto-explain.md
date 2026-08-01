# 06. Lab: catch a slow query in the logs

## Why this lab

The full cycle: generate a slow query → see it in `docker logs` → find it in `pg_stat_statements` → describe the on-call workflow.

## Prerequisites

- `perf.events` is in place
- `pg_stat_statements` ([intermediate/14](../postgresql-intermediate/14-lab-monitoring.md))

## Task 1. auto_explain in a session

```sql
LOAD 'auto_explain';
SET auto_explain.log_min_duration = '1ms';
SET auto_explain.log_analyze = on;
SET auto_explain.log_buffers = on;
```

## Task 2. Slow query (safe)

```sql
SELECT count(*) FROM perf.events WHERE pg_sleep(0.6) IS NOT NULL;
```

Alternative with load (careful on large tables):

```sql
SELECT count(*) FROM perf.events e1
CROSS JOIN perf.events e2
WHERE e1.id < 50 AND e2.id < 50;
```

## Task 3. Check the logs

```bash
docker logs mock-postgres 2>&1 | grep -E "duration:|EXPLAIN" | tail -30
```

**Expectation:**

- a `duration: ... ms` line ≥ 500 (or your threshold)
- an `EXPLAIN` block from auto_explain (if LOAD took effect)

Also check the global threshold:

```sql
SHOW log_min_duration_statement;
```

## Task 4. pg_stat_statements

```sql
SELECT left(query, 100), calls,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       round(total_exec_time::numeric, 2) AS total_ms
FROM pg_stat_statements
WHERE query LIKE '%perf.events%'
ORDER BY total_exec_time DESC
LIMIT 5;
```

Find the query with `pg_sleep` or the cross join.

## Task 5. Workflow document

`slow-query-workflow.md`:

```markdown
1. Alert: p99 latency / log threshold
2. pg_stat_statements: identify queryid
3. pg_stat_activity: active now?
4. Reproduce on staging with EXPLAIN (ANALYZE, BUFFERS)
5. Fix: index / rewrite / stats / vacuum
6. Verify: reset stats, deploy, monitor 24h
```

Fill it in with an example from this lab.

## If something went wrong

| Symptom | Solution |
|---------|---------|
| No duration in the logs | log_destination stderr; threshold above 600ms |
| No auto_explain | LOAD in the same session; shared_preload |
| pg_sleep not in the top | Run it 10 times in a row |

## Success criteria

- [ ] duration > 500ms in the logs
- [ ] Query found in pg_stat_statements
- [ ] Workflow described in 6 steps

## Next

Indexes deep dive: [07-index-types-deep.md](07-index-types-deep.md).
