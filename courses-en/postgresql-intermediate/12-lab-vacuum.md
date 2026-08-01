# 12. Lab: bloat and autovacuum

## Why this lab

You'll **deliberately** create dead tuples, watch `n_dead_tup` grow, run `VACUUM (VERBOSE)`, and compare the statistics before/after. This is the answer to the ticket "the table has bloated, autovacuum isn't helping" — with numbers from `pg_stat_user_tables`.

## Prerequisites

- `shop.orders` with data (ideally ≥ 10k rows from [basic/10-lab-indexes](../postgresql-basic/10-lab-indexes.md)).
- Connect as `course`.

## Task 1. Baseline

```sql
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, last_vacuum
FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'orders';

SELECT pg_size_pretty(pg_relation_size('shop.orders')) AS heap_size;
```

Write down `n_dead_tup` and the size.

## Task 2. Generate dead tuples

Option A — a mass no-op UPDATE:

```sql
UPDATE shop.orders SET qty = qty WHERE id <= 10000;
```

Option B — a loop (if there are few rows):

```sql
DO $$
BEGIN
  FOR i IN 1..200 LOOP
    UPDATE shop.orders SET qty = qty WHERE id = 1;
  END LOOP;
END $$;
```

Statistics again:

```sql
SELECT n_live_tup, n_dead_tup,
       round(n_dead_tup::numeric / nullif(n_live_tup + n_dead_tup, 0), 3) AS dead_ratio
FROM pg_stat_user_tables
WHERE relname = 'orders';
```

**Expected:** `n_dead_tup` grew.

## Task 3. Manual VACUUM

```sql
VACUUM (VERBOSE, ANALYZE) shop.orders;
```

In the VERBOSE output (in psql), look for `dead tuples`, `pages removed` / `pages remain`.

After:

```sql
SELECT n_dead_tup, last_vacuum, last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'orders';
```

**Expected:** `n_dead_tup` dropped, `last_vacuum` updated.

## Task 4. Size after VACUUM

```sql
SELECT pg_size_pretty(pg_relation_size('shop.orders')) AS heap_size_after;
```

A regular VACUUM does **not** always shrink the file on disk — the space is reused internally. A big reduction — only `VACUUM FULL` / pg_repack.

## Task 5. Per-table autovacuum (optional)

```sql
ALTER TABLE shop.orders SET (
  autovacuum_vacuum_scale_factor = 0.01
);
```

Repeat the UPDATE from task 2. Wait 1–2 minutes or lower it on the environment:

```sql
ALTER SYSTEM SET autovacuum_naptime = '10s';
SELECT pg_reload_conf();
```

Check `last_autovacuum` — a worker may have fired without a manual VACUUM.

**After the lab** restore naptime to the default if you like.

## Task 6. Freeze age (viewing)

```sql
SELECT datname, age(datfrozenxid) FROM pg_database;
```

On the lab environment, age is small. Remember this query for production monitoring.

## If something went wrong

| Symptom | Fix |
|---------|---------|
| n_dead_tup doesn't grow | HOT update optimization; UPDATE a column instead; more rows |
| VACUUM instant | Few dead tuples |
| No VERBOSE output | Run in psql, not via `-c` without a client |

## Success criteria

- [ ] Saw `n_dead_tup` grow before VACUUM
- [ ] `VACUUM (VERBOSE, ANALYZE)` executed
- [ ] `n_dead_tup` dropped after VACUUM
- [ ] You understand why the file doesn't always shrink

## Next

Monitoring: [13-monitoring.md](13-monitoring.md).
