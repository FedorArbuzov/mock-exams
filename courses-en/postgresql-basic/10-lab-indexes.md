# 10. Lab: Indexes and Query Plans

Theory from [09-indexes-explain](09-indexes-explain.md) is easy to forget without practice. You need to see plan nodes and buffers on real row counts. In this lab you will generate data, capture Seq Scan, add indexes, and compare `EXPLAIN (ANALYZE, BUFFERS)`.

You will also try composite, partial, and functional indexes.

## What you need

- `shop` schema with `products` and `orders` from [04-lab-ddl](04-lab-ddl.md)
- connected as `course`

## Task 1. Populate orders

```sql
INSERT INTO shop.orders (product_id, qty)
SELECT (random() * 2 + 1)::int,
       (random() * 5 + 1)::int
FROM generate_series(1, 50000);

ANALYZE shop.orders;
```

Check:

```sql
SELECT count(*) FROM shop.orders;
SELECT product_id, count(*) FROM shop.orders GROUP BY 1 ORDER BY 1;
```

Expected: ~50002 rows total and distribution across product IDs 1/2/3.

## Task 2. Seq Scan before index

```sql
DROP INDEX IF EXISTS shop.orders_product_id_idx;
ANALYZE shop.orders;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders WHERE product_id = 1;
```

Record:

- scan node type (expect Seq Scan)
- `actual rows`
- `Rows Removed by Filter`
- `Execution Time`
- buffers read/hit

## Task 3. Index Scan after index

```sql
CREATE INDEX orders_product_id_idx ON shop.orders (product_id);
ANALYZE shop.orders;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders WHERE product_id = 1;
```

Expected: Index Scan or Bitmap path.

Compare with Task 2:

| Metric | Before | After |
|--------|--------|-------|
| plan node | Seq Scan | Index / Bitmap |
| rows removed | high | lower |
| buffers | often higher | lower for selective path |
| time | cache-dependent | usually better on larger data |

## Task 4. Estimate vs actual

```sql
EXPLAIN SELECT * FROM shop.orders WHERE product_id = 1;
```

Compare `rows=` estimate with `actual rows=` from Task 3.

```sql
SELECT attname, n_distinct, most_common_vals
FROM pg_stats
WHERE schemaname = 'shop'
  AND tablename = 'orders'
  AND attname = 'product_id';
```

If mismatch is large, run `ANALYZE` again.

## Task 5. Composite index: filter + order

Add status column and values:

```sql
ALTER TABLE shop.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'delivered';

UPDATE shop.orders SET status = 'pending' WHERE id % 20 = 0;
UPDATE shop.orders SET status = 'shipped' WHERE id % 20 = 1;
ANALYZE shop.orders;
```

Create index:

```sql
CREATE INDEX orders_product_created_idx
  ON shop.orders (product_id, created_at DESC);
```

Test:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders
WHERE product_id = 1
ORDER BY created_at DESC
LIMIT 10;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM shop.orders
WHERE created_at > now() - interval '30 days'
ORDER BY created_at DESC
LIMIT 10;
```

First query should benefit more from the composite index.

## Task 6. Partial index

```sql
CREATE INDEX orders_pending_idx ON shop.orders (created_at)
  WHERE status = 'pending';
```

```sql
EXPLAIN (ANALYZE)
SELECT * FROM shop.orders
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 10;

EXPLAIN (ANALYZE)
SELECT * FROM shop.orders
WHERE status = 'delivered'
ORDER BY created_at DESC
LIMIT 10;
```

Partial index should serve pending-path only.

## Task 7. Functional index (`lower`)

```sql
CREATE TABLE IF NOT EXISTS shop.users (
  id    serial PRIMARY KEY,
  email text NOT NULL UNIQUE
);

INSERT INTO shop.users (email) VALUES
  ('Ivan@Shop.com'),
  ('maria@shop.com')
ON CONFLICT DO NOTHING;

DROP INDEX IF EXISTS shop.users_email_lower_idx;

EXPLAIN (ANALYZE)
SELECT * FROM shop.users WHERE lower(email) = 'ivan@shop.com';
```

Now add functional index:

```sql
CREATE INDEX users_email_lower_idx ON shop.users (lower(email));

EXPLAIN (ANALYZE)
SELECT * FROM shop.users WHERE lower(email) = 'ivan@shop.com';
```

## Task 8. Index usage stats

Run query a few times:

```sql
SELECT count(*) FROM shop.orders WHERE product_id = 2;
```

Inspect:

```sql
SELECT indexrelname, idx_scan, idx_tup_read,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes
WHERE schemaname = 'shop' AND relname = 'orders'
ORDER BY idx_scan;
```

`idx_scan` for `orders_product_id_idx` should increase.

## Task 9. Date-range query (optional)

```sql
EXPLAIN (ANALYZE)
SELECT * FROM shop.orders
WHERE created_at > now() - interval '1 day'
ORDER BY created_at DESC
LIMIT 10;
```

Compare with `orders_created_idx` from lab 04.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| still Seq Scan with index | too few rows/selectivity; test with larger dataset |
| partial index not used | predicate mismatch with index WHERE clause |
| functional index ignored | query expression differs from index expression |
| insert slow | expected with 50k inserts; use batching on real systems |

## You're done when

- [ ] 50k+ rows and `ANALYZE` done
- [ ] Saw Seq Scan before index and index-based scan after
- [ ] Composite index behavior validated
- [ ] Partial index used only for matching status predicate
- [ ] Functional index validated for `lower(email)`
- [ ] Understand estimate vs actual
- [ ] Observed `idx_scan` growth

## What's next

Transactions and MVCC: [11-transactions-mvcc.md](11-transactions-mvcc.md).
