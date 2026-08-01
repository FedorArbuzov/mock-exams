# 01. Planner and statistics

## Scenario from work

After the nightly ETL, `events` grew from 2M to 40M rows. In the morning the API returns 503: a heavy report by `device_id` suddenly does a **Seq Scan**. The index is in place, but `ANALYZE` after the load was forgotten — the planner thinks the table still has 2M rows and that an Index Scan is "more expensive". The DBA runs `ANALYZE perf.events` — the plan changes and latency drops from 8s to 200ms.

The performance course starts with the **planner** and **statistics** — without them, EXPLAIN and indexes are just guesswork.

**Prerequisites:** [basic/09-indexes-explain](../postgresql-basic/09-indexes-explain.md), [intermediate/14-lab-monitoring](../postgresql-intermediate/14-lab-monitoring.md).  
**Environment:** [`deploy/postgres`](../../deploy/postgres/README.md) — image with `hypopg`.

## What you'll learn

- How the planner estimates cost and selectivity
- `ANALYZE` vs `VACUUM`
- `statistics_target`, extended statistics
- Reading `pg_stats` and the estimate vs actual gap

## How the planner picks a plan

PostgreSQL builds a plan tree: Seq Scan, Index Scan, Hash Join, Nested Loop, Sort… Each node is assigned a **cost** (arbitrary units, not milliseconds).

```text
cost = f(row count, selectivity, row width, random_page_cost, cpu_operator_cost, ...)
```

The row estimate comes from the **statistics** in the `pg_statistic` catalog (visible via `pg_stats`).

| Bad statistics | Symptom |
|-------------------|---------|
| Stale after a bulk INSERT | Wrong Seq Scan / Index Scan |
| Low `statistics_target` | Poor histogram on skewed data |
| Correlated columns without extended stats | Wrong join order |

## ANALYZE

```sql
ANALYZE perf.events;
ANALYZE VERBOSE perf.events;
```

| | ANALYZE | VACUUM |
|---|---------|--------|
| Goal | Statistics for the planner | Dead tuples, freeze |
| Locks | Light | Regular VACUUM — not exclusive |
| After bulk load | **Required manually** | Autovacuum later |

Autovacuum triggers ANALYZE by thresholds, but for a **bulk load** — always run `ANALYZE` right after COMMIT.

## Statistics parameters

```sql
SHOW default_statistics_target;  -- often 100
```

```sql
ALTER TABLE perf.events ALTER COLUMN device_id SET STATISTICS 1000;
ANALYZE perf.events;
```

Higher target — more accurate histogram, slower ANALYZE, more space in `pg_statistic`.

**Extended statistics** — column correlation:

```sql
CREATE STATISTICS events_device_type (dependencies)
  ON device_id, event_type FROM perf.events;

ANALYZE perf.events;
```

When `device_id=42` is almost always `event_type='error'` — without dependencies the planner multiplies selectivities independently.

## Selectivity and pg_stats

```sql
SELECT attname, null_frac, avg_width, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'perf' AND tablename = 'events'
ORDER BY attname;
```

| Column | Interpretation |
|---------|---------------|
| `n_distinct` | Estimate of unique values (-1 = unique) |
| `correlation` | Physical order vs logical (BRIN hint) |
| `null_frac` | Fraction of NULLs |

The query `WHERE device_id = 42` with 1000 devices — ~0.1% of rows **if uniformly distributed**. Skew: one device_id = 30% of rows — you need a histogram with a high target.

## EXPLAIN: estimate vs actual

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM perf.events
WHERE device_id = 42 AND event_type = 'error'
  AND created_at > now() - interval '7 days';
```

Compare `rows=` (estimate) and `actual rows=` (ANALYZE). A 10× gap is a signal: ANALYZE, index, extended stats.

## Common mistakes

1. `CREATE INDEX` without a following `ANALYZE` — the planner doesn't fully know about the index.
2. Raising `statistics_target` on every column "just in case" — a slow ANALYZE.
3. Looking only at cost and ignoring `actual rows`.
4. Confusing VACUUM FULL with ANALYZE.

## Checklist

- [ ] ANALYZE vs VACUUM — different jobs
- [ ] When to increase `statistics_target`
- [ ] Where to look at histograms (`pg_stats`)
- [ ] estimate vs actual rows in EXPLAIN ANALYZE
- [ ] ANALYZE after a bulk load

## Next

Lab: [02-lab-analyze.md](02-lab-analyze.md).
