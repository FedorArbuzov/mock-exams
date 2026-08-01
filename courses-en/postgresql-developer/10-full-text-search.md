# 10. Full-text search

## Scenario

Shop catalog: search by name and SKU. PM: «Let's add Elasticsearch». Backend: 50k products, JOIN with orders, ACID — **Postgres FTS** is enough. For typos like `Widgt` — **pg_trgm**. Elasticsearch — when a separate search cluster and text analytics are justified.

In this course FTS is already in [`V2__add_search.sql`](examples/flyway/sql/V2__add_search.sql): `tsvector` + GIN + trigger.

## What you'll learn

- `tsvector`, `tsquery`, `@@`
- Configurations `english` vs `simple`
- Ranking with `ts_rank`
- `pg_trgm` for fuzzy
- Postgres FTS vs Elasticsearch

## tsvector and tsquery

```sql
SELECT to_tsvector('english', 'The quick brown foxes');
-- 'brown':3 'fox':4 'quick':2

SELECT plainto_tsquery('english', 'fox jumping');
SELECT to_tsvector('english', 'quick brown fox') @@ plainto_tsquery('english', 'fox');
-- true
```

| Function | Purpose |
|---------|------------|
| `to_tsvector(config, text)` | Normalized lexemes + positions |
| `plainto_tsquery(config, text)` | User input → AND query |
| `to_tsquery` | Syntax `fox & jump` |
| `@@` | Match operator |

**`simple`** — no stemming, for SKU/article codes. **`english`** — stems, stop words.

## search column + GIN

Pattern from V2:

```sql
ALTER TABLE devapp.products ADD COLUMN search tsvector;
UPDATE devapp.products SET search = to_tsvector('simple',
  coalesce(name,'') || ' ' || coalesce(sku,''));

CREATE INDEX products_search_idx ON devapp.products USING gin (search);
```

Trigger on INSERT/UPDATE — search always up to date.

## Search with ranking

```sql
SELECT sku, name, ts_rank(search, q) AS rank
FROM devapp.products, plainto_tsquery('simple', 'widget') q
WHERE search @@ q
ORDER BY rank DESC
LIMIT 20;
```

`ts_rank_cd` — accounts for distance between lexemes.

## Field weights

```sql
setweight(to_tsvector('simple', name), 'A') ||
setweight(to_tsvector('simple', sku), 'B')
```

Name outweighs SKU in rank.

## pg_trgm (fuzzy / LIKE)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

SELECT name FROM devapp.products WHERE name % 'Widgt';  -- similarity
SELECT name FROM devapp.products WHERE name ILIKE '%widget%';

CREATE INDEX products_name_trgm ON devapp.products
  USING gin (name gin_trgm_ops);
```

| Method | When |
|-------|-------|
| FTS `@@` | Words, stems, rank |
| `pg_trgm` | Typos, substring fuzzy |
| `ILIKE '%x%'` | Little data, no index — seq scan |

The [`deploy/postgres`](../../deploy/postgres/README.md) stand includes `pg_trgm`.

## Updating search

| Approach | Plus |
|--------|------|
| Trigger BEFORE INSERT/UPDATE | Always in sync |
| Generated column (PG 12+) | Declarative |
| Batch REFRESH | Rare bulk loads |

Do not forget reindex when changing config.

## Postgres FTS vs Elasticsearch

| | Postgres FTS | Elasticsearch |
|---|--------------|---------------|
| ACID + JOIN | ✅ native | Needs sync |
| Ops complexity | Low | Cluster, shards |
| Scale | Up to ~millions of docs OK | Billions, analytics |
| Fuzzy, facets | Basic | Rich |
| Consistency | Immediate | Near real-time |

## Common mistakes

1. FTS without GIN — seq scan.
2. `english` config for SKU `A1-B2` — tokenization breaks it.
3. Forgot the trigger — search stale after UPDATE.
4. `ILIKE '%term%'` on prod without trgm.
5. Duplicating everything into ES without need.

## Checklist

- [ ] simple vs english
- [ ] GIN on tsvector
- [ ] ts_rank for sorting
- [ ] pg_trgm for typos
- [ ] Trigger syncs search column

## Next

Lab: [11-lab-fts.md](11-lab-fts.md).
