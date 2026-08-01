# 09. Lab: JSONB

## Why this lab

Fill `orders.meta`, filter with `@>`, see a **GIN index scan** in EXPLAIN — the pattern for shop order attributes.

## Prerequisites

- [08-jsonb](08-jsonb.md)
- Table `devapp.orders` from Flyway

## Task 1. Update meta

```sql
UPDATE devapp.orders SET meta = jsonb_build_object(
  'channel', 'mobile',
  'campaign', 'spring',
  'items', jsonb_build_array(1, 2)
) WHERE id = 1;

UPDATE devapp.orders SET meta = '{"channel": "web", "campaign": "winter"}'::jsonb
WHERE id = 2;
```

If few rows — insert more:

```sql
INSERT INTO devapp.orders (product_id, qty, meta)
SELECT 1, 1, jsonb_build_object('channel', 'mobile', 'campaign', 'summer')
FROM generate_series(1, 100);
```

## Task 2. Queries

```sql
-- containment
SELECT id, meta FROM devapp.orders
WHERE meta @> '{"channel": "mobile"}';

-- scalar text
SELECT id, meta->>'campaign' AS campaign
FROM devapp.orders
WHERE meta->>'channel' = 'web';

-- nested array
SELECT id FROM devapp.orders
WHERE meta->'items' @> '1';
```

Record each result: how many rows.

## Task 3. Operators

In one script demonstrate:

| Operator | Example | Result |
|----------|--------|-----------|
| `->` | `meta->'channel'` | jsonb |
| `->>` | `meta->>'channel'` | text |
| `@>` | `meta @> '{"channel":"mobile"}'` | filter |
| `?` | `meta ? 'campaign'` | filter |

## Task 4. GIN index

```sql
CREATE INDEX IF NOT EXISTS orders_meta_gin
  ON devapp.orders USING gin (meta jsonb_path_ops);

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM devapp.orders WHERE meta @> '{"channel": "mobile"}';
```

Expected at ≥100 rows: `Bitmap Index Scan` on `orders_meta_gin`.

Without the index:

```sql
DROP INDEX IF EXISTS orders_meta_gin;
EXPLAIN SELECT * FROM devapp.orders WHERE meta @> '{"channel": "mobile"}';
```

Compare: Seq Scan vs Index Scan.

Recreate the index for later lessons.

## Task 5. Expression index (optional)

```sql
CREATE INDEX orders_channel_idx ON devapp.orders ((meta->>'channel'));
EXPLAIN SELECT * FROM devapp.orders WHERE meta->>'channel' = 'mobile';
```

## Troubleshooting

| Problem | Fix |
|----------|-----|
| No rows | UPDATE WHERE id — check id |
| Seq Scan with index | few rows — planner prefers seq |
| jsonb_path_ops + `?` | path_ops does not support `?` — default ops |

## Success criteria

- [ ] Three operators: `->`, `->>`, `@>`
- [ ] GIN index created
- [ ] EXPLAIN with Bitmap Index Scan (or explain seq on small data)
- [ ] jsonb_build_object for structured meta

## Next

FTS: [10-full-text-search.md](10-full-text-search.md).
