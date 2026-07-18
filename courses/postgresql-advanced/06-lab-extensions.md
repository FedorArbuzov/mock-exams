# 06. Лаба: pg_trgm и bloat inspect

## Зачем эта лаба

Практика двух расширений из [05-extensions](05-extensions.md): **pg_trgm** для ILIKE и **pgstattuple** для измерения bloat на `shop.orders` после лаб vacuum из intermediate.

## Предусловия

- Схема `shop` с `products` и `orders`
- Желательно dead tuples на orders ([intermediate/12-lab-vacuum](../postgresql-intermediate/12-lab-vacuum.md))

## Задание 1. pg_trgm — план до индекса

```sql
EXPLAIN ANALYZE
SELECT * FROM shop.products WHERE name ILIKE '%get%';
```

Запишите узел (ожидаем Seq Scan на маленькой таблице).

## Задание 2. GIN trgm индекс

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX products_name_trgm_idx ON shop.products
  USING gin (name gin_trgm_ops);

ANALYZE shop.products;

EXPLAIN ANALYZE
SELECT * FROM shop.products WHERE name ILIKE '%get%';
```

**Ожидание:** Bitmap Index Scan / Index Scan на GIN (на tiny table planner может всё ещё Seq — тогда `SET enable_seqscan = off` **только для демо**).

Проверьте размер индекса:

```sql
SELECT pg_size_pretty(pg_relation_size('shop.products_name_trgm_idx'));
```

## Задание 3. similarity (опционально)

```sql
SELECT name, similarity(name, 'Gadget') AS sim
FROM shop.products
WHERE name % 'Gadget'
ORDER BY sim DESC;
```

Оператор `%` — trgm similarity threshold (`pg_trgm.similarity_threshold`).

## Задание 4. pgstattuple на orders

Создайте bloat если нужно:

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

Сравните с:

```sql
SELECT n_live_tup, n_dead_tup FROM pg_stat_user_tables
WHERE relname = 'orders';
```

## Задание 5. После VACUUM

```sql
VACUUM (VERBOSE, ANALYZE) shop.orders;

SELECT dead_tuple_percent FROM pgstattuple('shop.orders');
```

`dead_tuple_percent` должен снизиться.

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| extension not available | Образ deploy/postgres; `CREATE EXTENSION` от superuser |
| GIN not used | Мало строк; enable_seqscan off для demo |
| pgstattuple slow | Большая таблица — нормально, не в пик |

## Критерии успеха

- [ ] GIN trgm индекс создан
- [ ] EXPLAIN с индексом (или обоснован Seq на micro table)
- [ ] pgstattuple показал dead_tuple_percent
- [ ] После VACUUM — снижение dead %

## Дальше

Security: [07-security.md](07-security.md).
