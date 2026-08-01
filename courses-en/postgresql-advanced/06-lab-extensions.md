# 06. Lab: pg_trgm and bloat inspection

## Why this lab

Practice with two extensions from [05-extensions](05-extensions.md): **pg_trgm** for ILIKE and **pgstattuple** for measuring bloat on `shop.orders` after the vacuum labs from intermediate.

## Prerequisites

- The `shop` schema with `products` and `orders`
- Preferably dead tuples on orders ([intermediate/12-lab-vacuum](../postgresql-intermediate/12-lab-vacuum.md))

## Task 1. pg_trgm — plan before the index

```sql
EXPLAIN ANALYZE
SELECT * FROM shop.products WHERE name ILIKE '%get%';
```

Write down the node (we expect a Seq Scan on a small table).

## Task 2. GIN trgm index

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX products_name_trgm_idx ON shop.products
  USING gin (name gin_trgm_ops);

ANALYZE shop.products;

EXPLAIN ANALYZE
SELECT * FROM shop.products WHERE name ILIKE '%get%';
```

**Expected:** Bitmap Index Scan / Index Scan on GIN (on a tiny table the planner may still use Seq — then `SET enable_seqscan = off` **for the demo only**).

Check the index size:

```sql
SELECT pg_size_pretty(pg_relation_size('shop.products_name_trgm_idx'));
```

## Task 3. similarity (optional)

```sql
SELECT name, similarity(name, 'Gadget') AS sim
FROM shop.products
WHERE name % 'Gadget'
ORDER BY sim DESC;
```

The `%` operator — trgm similarity threshold (`pg_trgm.similarity_threshold`).

## Task 4. pgstattuple on orders

Create bloat if needed:

```sql
UPDATE shop.orders SET qty = qty WHERE id <= 5000;
```

```sql
CREATE EXTENSION IF NOT EXISTS pgstattuple;

SELECT table_len,
       tuple_percent,
       dead_tuple_percent,
       free_space
FROM pgstattuple('shop.orders');
```

Compare with:

```sql
SELECT n_live_tup, n_dead_tup FROM pg_stat_user_tables
WHERE relname = 'orders';
```

## Task 5. After VACUUM

```sql
VACUUM (VERBOSE, ANALYZE) shop.orders;

SELECT dead_tuple_percent FROM pgstattuple('shop.orders');
```

`dead_tuple_percent` should decrease.

## If something goes wrong

| Symptom | Solution |
|---------|---------|
| extension not available | The deploy/postgres image; `CREATE EXTENSION` as superuser |
| GIN not used | Too few rows; enable_seqscan off for the demo |
| pgstattuple slow | A large table — that's normal, not at peak |

## Success criteria

- [ ] GIN trgm index created
- [ ] EXPLAIN with the index (or Seq on a micro table justified)
- [ ] pgstattuple showed dead_tuple_percent
- [ ] After VACUUM — dead % decreased

## Next

Security: [07-security.md](07-security.md).
