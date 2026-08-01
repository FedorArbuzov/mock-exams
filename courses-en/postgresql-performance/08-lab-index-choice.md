# 08. Lab: time-series events

## Why this lab

On a single reporting query, compare **no index**, **BRIN**, and **partial B-tree** — table size / time / plan. This is a typical performance-review task for an event store.

## Prerequisites

- `perf.events` ~500k+ rows ([examples/events-schema.sql](examples/events-schema.sql))

## Query for all experiments

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM perf.events
WHERE event_type = 'error'
  AND created_at >= now() - interval '30 days'
ORDER BY created_at DESC
LIMIT 100;
```

## Experiment 1. Baseline (no suitable index)

Drop the indexes on `perf.events` except the PK (carefully):

```sql
DROP INDEX IF EXISTS perf.events_created_brin;
DROP INDEX IF EXISTS perf.events_errors_idx;
```

`ANALYZE perf.events;` — then EXPLAIN.

Record: Scan type, Execution Time, Buffers.

## Experiment 2. BRIN on created_at

```sql
CREATE INDEX events_created_brin ON perf.events USING brin (created_at);
ANALYZE perf.events;
```

Repeat EXPLAIN. BRIN helps the range on time; the `event_type` filter may be a filter on the heap.

## Experiment 3. Partial index on errors

```sql
DROP INDEX IF EXISTS perf.events_created_brin;

CREATE INDEX events_errors_created_idx ON perf.events (created_at DESC)
WHERE event_type = 'error';

ANALYZE perf.events;
```

Repeat EXPLAIN.

**Expectation:** Bitmap Index Scan / Index Scan, better time with a skew toward `error`.

## Experiment 4. Index sizes

```sql
SELECT indexrelid::regclass AS index_name,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_index
JOIN pg_class ON pg_class.oid = indexrelid
WHERE indrelid = 'perf.events'::regclass
  AND indexrelid::regclass::text NOT LIKE '%_pkey';
```

Or `\di+ perf.events*`

## Summary table (fill in)

| Variant | Index | Size | Execution Time | Plan node |
|---------|--------|--------|----------------|------------|
| 1. None | — | — | | |
| 2. BRIN | created_at | | | |
| 3. Partial | errors + created_at | | | |

## Task 5. Recommendation for prod

2–3 sentences:

- Which index would you keep?
- Do you need [partitioning](../postgresql-advanced/03-partitioning.md) at 10B rows?
- INSERT risk with each new error index

## If something went wrong

| Symptom | Solution |
|---------|---------|
| Few error rows | Fine; partial is still smaller |
| All plans Seq Scan | Too few rows; lowering LIMIT won't help — you need scale |
| DROP failed | Dependencies — DROP CONCURRENTLY isn't for the BRIN drop issue |

## Success criteria

- [ ] Comparison table filled in
- [ ] Three EXPLAINs saved
- [ ] Recommendation for prod written

## Next

pgbench: [09-pgbench-methodology.md](09-pgbench-methodology.md).
