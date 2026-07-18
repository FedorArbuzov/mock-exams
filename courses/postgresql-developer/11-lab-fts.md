# 11. Лаба: FTS

## Зачем эта лаба

Проверить FTS из Flyway V2 и добавить **trigram** поиск — два паттерна catalog search в shop без Elasticsearch.

## Предусловия

- [03-lab-flyway](03-lab-flyway.md) — V2 applied
- [10-full-text-search](10-full-text-search.md)

## Задание 1. Данные для поиска

```sql
INSERT INTO devapp.products (sku, name, price) VALUES
  ('WGT-01', 'Widget Pro', 19.99),
  ('WGT-02', 'Widget Basic', 9.99),
  ('BLT-99', 'Heavy Bolt', 2.50)
ON CONFLICT (sku) DO UPDATE SET name = EXCLUDED.name;
```

## Задание 2. FTS с rank

```sql
SELECT sku, name, ts_rank(search, q) AS rank
FROM devapp.products, plainto_tsquery('simple', 'widget') q
WHERE search @@ q
ORDER BY rank DESC;
```

Ожидание: `WGT-01`, `WGT-02` (и `A1` если из лабы 03).

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT sku, name FROM devapp.products, plainto_tsquery('simple', 'widget') q
WHERE search @@ q;
```

Ожидание: `Bitmap Index Scan` на `products_search_idx`.

## Задание 3. Конфигурация simple vs english

```sql
SELECT to_tsvector('english', 'running runners') @@ plainto_tsquery('english', 'run');
SELECT to_tsvector('simple', 'running runners') @@ plainto_tsquery('simple', 'run');
```

Запишите: почему для SKU используем `simple`.

## Задание 4. pg_trgm fuzzy

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

## Задание 5. Trigram индекс

```sql
CREATE INDEX IF NOT EXISTS products_name_trgm
  ON devapp.products USING gin (name gin_trgm_ops);

EXPLAIN SELECT name FROM devapp.products WHERE name % 'Widgt';
```

При малом объёме — seq scan OK; опишите при каком N нужен индекс.

## Troubleshooting

| Проблема | Fix |
|----------|-----|
| search is null | UPDATE products SET name = name (trigger) |
| No FTS results | проверьте config `simple` |
| extension pg_trgm | CREATE EXTENSION |
| Empty @@ | plainto_tsquery stop words в english |

## Критерии успеха

- [ ] FTS запрос с ts_rank
- [ ] EXPLAIN с GIN на search
- [ ] Trigram запрос `%` работает
- [ ] simple для SKU объяснён

## Дальше

Advisory locks: [12-advisory-locks.md](12-advisory-locks.md).
