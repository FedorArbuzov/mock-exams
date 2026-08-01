# 14. Lab: pg_stat_statements

## Why this lab

`pg_stat_statements` is the first performance-review tool after an incident. You'll enable the extension (often already in preload on the environment), generate load with a JOIN query, and find it in the top by `total_exec_time`, plus an unused index by `idx_scan`.

## Prerequisites

- The `shop` schema with `orders` and `products`.
- An environment with `pg_stat_statements` in the image ([deploy/postgres](../../deploy/postgres/README.md)).

## Task 1. The extension

```sql
SELECT * FROM pg_available_extensions WHERE name = 'pg_stat_statements';

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_stat_statements';
```

If `CREATE` fails with a preload error:

```sql
SHOW shared_preload_libraries;
```

It should contain `pg_stat_statements`. Otherwise — `ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';` + a container restart.

## Task 2. Reset and load

```sql
SELECT pg_stat_statements_reset();
```

Generate load (20+ times):

```sql
SELECT o.id, p.name, p.price, o.qty
FROM shop.orders o
JOIN shop.products p ON p.id = o.product_id
WHERE p.price > 1
ORDER BY o.created_at DESC
LIMIT 100;
```

In psql it's convenient:

```sql
\watch 0.2
```

Or shell:

```bash
for i in $(seq 1 25); do
  psql "postgresql://course:course@localhost:5432/course" -c \
    "SELECT o.id FROM shop.orders o JOIN shop.products p ON p.id = o.product_id WHERE p.price > 1 LIMIT 100;" -q
done
```

## Task 3. Top queries

```sql
SELECT left(query, 100) AS query_preview,
       calls,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       round(total_exec_time::numeric, 2) AS total_ms,
       rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 10;
```

**Expected:** the JOIN of `orders` / `products` in the top with `calls` ≥ 20.

Answer in writing: why sort by `total_exec_time` and not just by `mean_exec_time`?

## Task 4. A slow outlier (optional)

```sql
SET enable_seqscan = on;
SET work_mem = '64kB';
-- one heavy JOIN
RESET work_mem;
```

Find the query with a high `max_exec_time` (PG 14+):

```sql
SELECT left(query, 60), calls, round(max_exec_time::numeric, 2) AS max_ms
FROM pg_stat_statements
ORDER BY max_exec_time DESC
LIMIT 5;
```

## Task 5. Unused indexes

```sql
SELECT schemaname, relname AS table_name,
       indexrelname AS index_name,
       idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'shop'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
```

**Expected:** possibly an index with `idx_scan = 0` (created in the labs but not hit by a WHERE). Don't drop it in production without analyzing rare reports.

## Task 6. seq_scan on a table

```sql
SELECT relname, seq_scan, idx_scan, n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'shop';
```

If `seq_scan` >> `idx_scan` on `orders` — the link to [basic/09-indexes-explain](../postgresql-basic/09-indexes-explain.md).

## If something went wrong

| Symptom | Fix |
|---------|---------|
| Empty pg_stat_statements | preload + restart; extension created |
| No JOIN in the top | Few calls; reset and repeat the loop |
| All queries < 1ms | Little data — OK for the environment |

## Success criteria

- [ ] `pg_stat_statements` is installed and returns rows
- [ ] The JOIN query is in the top by total time after load
- [ ] Found an index with a low `idx_scan` (if there's a candidate)
- [ ] You can explain total vs mean exec time

## Next

PgBouncer: [15-pgbouncer.md](15-pgbouncer.md).
