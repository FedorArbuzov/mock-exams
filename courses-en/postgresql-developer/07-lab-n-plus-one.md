# 07. Lab: N+1

## Why this lab

On `devapp` data, **feel** the difference N+1 vs JOIN: round-trips, `\timing`, EXPLAIN — before APM on prod shows 201 queries.

## Prerequisites

- [03-lab-flyway](03-lab-flyway.md) — schema `devapp`
- [06-n-plus-one](06-n-plus-one.md)

## Task 1. Test data

```sql
INSERT INTO devapp.products (sku, name, price) VALUES
  ('B1', 'Bolt', 1.00),
  ('B2', 'Nut', 0.50),
  ('B3', 'Washer', 0.25)
ON CONFLICT (sku) DO NOTHING;

INSERT INTO devapp.orders (product_id, qty) VALUES
  (1, 2), (1, 1), (2, 5), (3, 10), (2, 3);
```

Verification:

```sql
SELECT count(*) FROM devapp.orders;
```

## Task 2. Bad pattern (N+1 simulation)

```sql
\timing on
```

```sql
-- "application": first all orders
SELECT id, product_id FROM devapp.orders;
```

For **each** row manually (or via script) run:

```sql
SELECT name, price FROM devapp.products WHERE id = 1;
SELECT name, price FROM devapp.products WHERE id = 1;
-- ... once per order
```

Record:

| Metric | N+1 |
|---------|-----|
| Query count | orders + 1 |
| Total time (\timing) | |

## Task 3. Good pattern — JOIN

```sql
\timing on
EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id, o.qty, o.product_id, p.name, p.price
FROM devapp.orders o
JOIN devapp.products p ON p.id = o.product_id
ORDER BY o.id;
```

Expected:

- **1 query** in the log
- Plan: `Nested Loop` or `Hash Join` with Index Scan on `products_pkey`
- Time ≤ N+1 approach

## Task 4. Batch IN

```sql
WITH ord AS (
  SELECT id, product_id FROM devapp.orders
)
SELECT o.id, o.product_id, p.name
FROM ord o
JOIN devapp.products p ON p.id = o.product_id;
```

Or two steps:

```sql
SELECT DISTINCT product_id FROM devapp.orders;
SELECT * FROM devapp.products WHERE id IN (1, 2, 3);
```

Record: **2 round-trips** vs N+1.

## Task 5. Index on FK

```sql
EXPLAIN SELECT * FROM devapp.orders o
JOIN devapp.products p ON p.id = o.product_id
WHERE o.id = 1;
```

If Seq Scan on products — add (for the lab PK is usually enough):

```sql
CREATE INDEX IF NOT EXISTS orders_product_id_idx ON devapp.orders (product_id);
```

## Troubleshooting

| Symptom | Cause |
|---------|---------|
| Empty orders | did not insert data |
| FK violation | product_id does not exist |
| Same timing | too few rows — increase INSERT loop |

## Success criteria

- [ ] EXPLAIN JOIN — one plan, join on products
- [ ] Comparison: query count N+1 vs 1
- [ ] Understanding why index on product_id
- [ ] Timing numbers recorded

## Next

JSONB: [08-jsonb.md](08-jsonb.md).
