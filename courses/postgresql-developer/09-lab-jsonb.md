# 09. Лаба: JSONB

## Зачем эта лаба

Заполнить `orders.meta`, отфильтровать через `@>`, увидеть **GIN index scan** в EXPLAIN — паттерн для shop order attributes.

## Предусловия

- [08-jsonb](08-jsonb.md)
- Таблица `devapp.orders` из Flyway

## Задание 1. Обновить meta

```sql
UPDATE devapp.orders SET meta = jsonb_build_object(
  'channel', 'mobile',
  'campaign', 'spring',
  'items', jsonb_build_array(1, 2)
) WHERE id = 1;

UPDATE devapp.orders SET meta = '{"channel": "web", "campaign": "winter"}'::jsonb
WHERE id = 2;
```

Если мало строк — вставьте ещё:

```sql
INSERT INTO devapp.orders (product_id, qty, meta)
SELECT 1, 1, jsonb_build_object('channel', 'mobile', 'campaign', 'summer')
FROM generate_series(1, 100);
```

## Задание 2. Запросы

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

Запишите результат каждого: сколько строк.

## Задание 3. Операторы

В одном скрипте продемонстрируйте:

| Оператор | Пример | Результат |
|----------|--------|-----------|
| `->` | `meta->'channel'` | jsonb |
| `->>` | `meta->>'channel'` | text |
| `@>` | `meta @> '{"channel":"mobile"}'` | filter |
| `?` | `meta ? 'campaign'` | filter |

## Задание 4. GIN индекс

```sql
CREATE INDEX IF NOT EXISTS orders_meta_gin
  ON devapp.orders USING gin (meta jsonb_path_ops);

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM devapp.orders WHERE meta @> '{"channel": "mobile"}';
```

Ожидание при ≥100 rows: `Bitmap Index Scan` на `orders_meta_gin`.

Без индекса:

```sql
DROP INDEX IF EXISTS orders_meta_gin;
EXPLAIN SELECT * FROM devapp.orders WHERE meta @> '{"channel": "mobile"}';
```

Сравните: Seq Scan vs Index Scan.

Пересоздайте индекс для следующих уроков.

## Задание 5. Expression index (опционально)

```sql
CREATE INDEX orders_channel_idx ON devapp.orders ((meta->>'channel'));
EXPLAIN SELECT * FROM devapp.orders WHERE meta->>'channel' = 'mobile';
```

## Troubleshooting

| Проблема | Fix |
|----------|-----|
| No rows | UPDATE WHERE id — проверьте id |
| Seq Scan с индексом | мало строк — planner prefers seq |
| jsonb_path_ops + `?` | path_ops не поддерживает `?` — default ops |

## Критерии успеха

- [ ] Три оператора: `->`, `->>`, `@>`
- [ ] GIN индекс создан
- [ ] EXPLAIN с Bitmap Index Scan (или объяснение seq на малых данных)
- [ ] jsonb_build_object для structured meta

## Дальше

FTS: [10-full-text-search.md](10-full-text-search.md).
