# 12. Lab: hypopg → real index

## Why this lab

The full cycle: baseline plan → hypopg → decision on `CREATE INDEX` → verification after creation.

## Prerequisites

- `perf.events` + `CREATE EXTENSION hypopg`
- A query with a noticeable Seq Scan

## Task 1. Plan without an index

Make sure there's no index on `(device_id, created_at)`:

```sql
DROP INDEX IF EXISTS perf.events_device_created_idx;
ANALYZE perf.events;

EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM perf.events
WHERE device_id BETWEEN 10 AND 20
  AND created_at > now() - interval '14 days';
```

Record: Scan type, Execution Time, cost.

## Task 2. Hypothetical index

```sql
SELECT indexrelid, indexname FROM hypopg_create_index(
  'CREATE INDEX ON perf.events (device_id, created_at)'
);

EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM perf.events
WHERE device_id BETWEEN 10 AND 20
  AND created_at > now() - interval '14 days';
```

Compare cost and time. **Note:** on the first EXPLAIN with hypopg, ANALYZE may not use the index fully yet — look at the plan node.

```sql
SELECT * FROM hypopg_list_index;
SELECT hypopg_reset();
```

## Task 3. Real index

If the gain is substantial:

```sql
CREATE INDEX events_device_created_idx
  ON perf.events (device_id, created_at);
-- prod: CREATE INDEX CONCURRENTLY ...

ANALYZE perf.events;

EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM perf.events
WHERE device_id BETWEEN 10 AND 20
  AND created_at > now() - interval '14 days';
```

## Task 4. Decision table

| Stage | Index Scan? | Execution Time | Index size |
|------|-------------|----------------|----------------|
| No index | | | — |
| hypopg only | | | 0 (virtual) |
| Real index | | | `pg_relation_size` |

```sql
SELECT pg_size_pretty(pg_relation_size('perf.events_device_created_idx'));
```

## Task 5. Justifying a rejection (if the index isn't needed)

If the difference is small — write up why **not** to create the index (write cost, rare query).

## If something went wrong

| Symptom | Solution |
|---------|---------|
| hypopg not available | Rebuild the deploy/postgres image |
| Plan doesn't change | ANALYZE; query too selective / table too small |
| hypopg_create_index error | DDL syntax in the string |

## Success criteria

- [ ] Plan before/after hypopg compared
- [ ] hypopg_reset() run
- [ ] Real index created **or** rejection justified
- [ ] ANALYZE after CREATE INDEX

## Next

Final: [13-final-project.md](13-final-project.md).
