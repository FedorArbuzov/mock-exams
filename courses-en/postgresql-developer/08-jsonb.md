# 08. JSONB

## Scenario

Product wants «flexible attributes» on orders: channel, campaign, A/B flags — change every week. 30 nullable columns in `orders` or **jsonb `meta`**? The team chose JSONB; a month later queries `WHERE meta->>'channel' = 'mobile'` without an index — full table scan on 5M rows.

JSONB is a powerful type, but it needs **index discipline** and knowing when to normalize.

## What you'll learn

- `json` vs `jsonb`
- Operators `->`, `->>`, `@>`, `?`
- GIN and expression indexes
- When to promote to a column

## json vs jsonb

| | `json` | `jsonb` |
|---|--------|---------|
| Storage | Text as-is | Decomposed binary |
| Key order | Preserved | Not guaranteed |
| Key dedup | No | Yes |
| Indexes | Limited | GIN, btree on expression |
| Insert | Faster | Slightly slower (parse) |

In 2024+ almost always **`jsonb`**.

The column is already in [`V1__init.sql`](examples/flyway/sql/V1__init.sql): `orders.meta`.

## Operators

```sql
UPDATE devapp.orders
SET meta = '{"source": "web", "tags": ["sale"], "discount": 10}'::jsonb
WHERE id = 1;

-- json object field (jsonb)
SELECT meta->'tags' FROM devapp.orders WHERE id = 1;

-- text scalar
SELECT meta->>'source' AS source FROM devapp.orders;

-- containment
SELECT id FROM devapp.orders WHERE meta @> '{"source": "web"}';

-- key exists
SELECT id FROM devapp.orders WHERE meta ? 'tags';

-- path
SELECT meta#>>'{tags,0}' FROM devapp.orders;
```

| Operator | Returns |
|----------|------------|
| `->` | jsonb |
| `->>` | text |
| `@>` | contains (boolean) |
| `?` | key exists |

## Building in SQL

```sql
UPDATE devapp.orders SET meta = jsonb_build_object(
  'channel', 'mobile',
  'campaign', 'spring',
  'items', jsonb_build_array(1, 2)
) WHERE id = 1;
```

In the app — serialize a dict; do not glue JSON as a string (structure injection).

## Indexes

### GIN on entire meta

```sql
CREATE INDEX orders_meta_gin ON devapp.orders USING gin (meta);
-- queries @>, ?, ?&
```

### jsonb_path_ops — smaller index

```sql
CREATE INDEX orders_meta_gin ON devapp.orders USING gin (meta jsonb_path_ops);
-- only @>, not ?
```

### Expression index on a hot key

```sql
CREATE INDEX orders_meta_channel_idx ON devapp.orders ((meta->>'channel'));
-- WHERE meta->>'channel' = 'mobile'
```

Frequent filters on one field — **generated column** (PG 12+):

```sql
ALTER TABLE devapp.orders
  ADD COLUMN channel text GENERATED ALWAYS AS (meta->>'channel') STORED;
CREATE INDEX orders_channel_idx ON devapp.orders (channel);
```

## When NOT JSONB

| Situation | Solution |
|----------|---------|
| FK, strict schema | Normal columns |
| Aggregates SUM on a field | numeric column |
| Text search inside | FTS or a separate column |
| Frequent UPDATE of the whole blob | Row bloat — normalize |

## Bloat and size

Large JSONB in a hot row — every UPDATE = a new row version (MVCC). Move rarely changing data to a side table.

See [intermediate/11-vacuum](../postgresql-intermediate/11-vacuum-bloat.md).

## Common mistakes

1. `@>` without GIN on a large table.
2. `meta->>key` without an index on a hot path.
3. Storing arrays of 10k elements in one jsonb.
4. Comparing `meta->>'count' > '10'` — text compare, not numeric.
5. Duplicating JSONB and columns without a sync strategy.

## Checklist

- [ ] `->` vs `->>`
- [ ] GIN for `@>` vs expression for `->>`
- [ ] jsonb_path_ops tradeoff
- [ ] Generated column for hot filter
- [ ] When to normalize

## Next

Lab: [09-lab-jsonb.md](09-lab-jsonb.md).
