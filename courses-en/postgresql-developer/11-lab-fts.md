# 11. Lab: FTS

## Why this lab

Verify FTS from Flyway V2 and add **trigram** search — two catalog search patterns in a shop without Elasticsearch.

## Prerequisites

- [03-lab-flyway](03-lab-flyway.md) — V2 applied
- [10-full-text-search](10-full-text-search.md)

## Task 1. Search data

```sql
INSERT INTO devapp.products (sku, name, price) VALUES
  ('WGT-01', 'Widget Pro', 19.99),
  ('WGT-02', 'Widget Basic', 9.99),
  ('BLT-99', 'Heavy Bolt', 2.50)
ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name;
```

## Task 2. FTS with rank

```sql
SELECT sku, name, ts_rank(search, q) AS rank
FROM devapp.products, plainto_tsquery('simple', 'widget') q
WHERE search @@ q
ORDER BY rank DESC;
```

Expected: `WGT-01`, `WGT-02` (and `A1` if from lab 03).

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT sku, name FROM devapp.products, plainto_tsquery('simple', 'widget') q
WHERE search @@ q;
```

Expected: `Bitmap Index Scan` on `products_search_idx`.

## Task 3. Configuration simple vs english

```sql
SELECT to_tsvector('english', 'running runners') @@ plainto_tsquery('english', 'run');
SELECT to_tsvector('simple', 'running runners') @@ plainto_tsquery('simple', 'run');
```

Record: why we use `simple` for SKU.

## Task 4. pg_trgm fuzzy

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT sku, name, similarity(name, 'Widgt') AS sim
FROM devapp.products
WHERE name % 'Widgt'
ORDER BY sim DESC;
```

```sql
SELECT * FROM devapp.products
WHERE sku ILIKE '%WGT%' OR name % 'Widg';
```

## Task 5. Trigram index

```sql
CREATE INDEX IF NOT EXISTS products_name_trgm
  ON devapp.products USING gin (name gin_trgm_ops);

EXPLAIN SELECT name FROM devapp.products WHERE name % 'Widgt';
```

On small volume — seq scan is OK; describe at what N you need the index.

## Troubleshooting

| Problem | Fix |
|----------|-----|
| search is null | UPDATE products SET name = name (trigger) |
| No FTS results | check config `simple` |
| extension pg_trgm | CREATE EXTENSION |
| Empty @@ | plainto_tsquery stop words in english |

## Success criteria

- [ ] FTS query with ts_rank
- [ ] EXPLAIN with GIN on search
- [ ] Trigram query `%` works
- [ ] simple for SKU explained

## Next

Advisory locks: [12-advisory-locks.md](12-advisory-locks.md).
