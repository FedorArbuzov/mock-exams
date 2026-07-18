# 14. Лаба: pg_stat_statements

## Зачем эта лаба

`pg_stat_statements` — первый инструмент performance review после инцидента. Вы включите расширение (на стенде часто уже в preload), создадите нагрузку JOIN-запросом и найдёте его в top по `total_exec_time` и неиспользуемый индекс по `idx_scan`.

## Предусловия

- Схема `shop` с `orders` и `products`.
- Стенд с `pg_stat_statements` в образе ([deploy/postgres](../../deploy/postgres/README.md)).

## Задание 1. Расширение

```sql
SELECT * FROM pg_available_extensions WHERE name = 'pg_stat_statements';

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT extname, extversion FROM pg_extension WHERE extname = 'pg_stat_statements';
```

Если `CREATE` падает с preload error:

```sql
SHOW shared_preload_libraries;
```

Должен содержать `pg_stat_statements`. Иначе — `ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';` + restart контейнера.

## Задание 2. Сброс и нагрузка

```sql
SELECT pg_stat_statements_reset();
```

Сгенерируйте нагрузку (20+ раз):

```sql
SELECT o.id, p.name, p.price, o.qty
FROM shop.orders o
JOIN shop.products p ON p.id = o.product_id
WHERE p.price > 1
ORDER BY o.created_at DESC
LIMIT 100;
```

В psql удобно:

```sql
\watch 0.2
```

Или shell:

```bash
for i in $(seq 1 25); do
  psql "postgresql://course:course@localhost:5432/course" -c \
    "SELECT o.id FROM shop.orders o JOIN shop.products p ON p.id = o.product_id WHERE p.price > 1 LIMIT 100;" -q
done
```

## Задание 3. Top queries

```sql
SELECT left(query, 100) AS query_preview,
       calls,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       round(total_exec_time::numeric, 2) AS total_ms,
       rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 10;
```

**Ожидание:** JOIN `orders` / `products` в top с `calls` ≥ 20.

Ответьте письменно: почему сортировать по `total_exec_time`, а не только по `mean_exec_time`?

## Задание 4. Медленный outlier (опционально)

```sql
SET enable_seqscan = on;
SET work_mem = '64kB';
-- один тяжёлый JOIN
RESET work_mem;
```

Найдите запрос с высоким `max_exec_time` (PG 14+):

```sql
SELECT left(query, 60), calls, round(max_exec_time::numeric, 2) AS max_ms
FROM pg_stat_statements
ORDER BY max_exec_time DESC
LIMIT 5;
```

## Задание 5. Неиспользуемые индексы

```sql
SELECT schemaname, relname AS table_name,
       indexrelname AS index_name,
       idx_scan,
       pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'shop'
ORDER BY idx_scan ASC, pg_relation_size(indexrelid) DESC;
```

**Ожидание:** возможен индекс с `idx_scan = 0` (созданный в лабах, но не попавший в WHERE). Не удаляйте на проде без анализа редких отчётов.

## Задание 6. seq_scan на таблице

```sql
SELECT relname, seq_scan, idx_scan, n_live_tup
FROM pg_stat_user_tables
WHERE schemaname = 'shop';
```

Если `seq_scan` >> `idx_scan` на `orders` — связь с [basic/09-indexes-explain](../postgresql-basic/09-indexes-explain.md).

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Пустой pg_stat_statements | preload + restart; extension created |
| Нет JOIN в top | Мало calls; сбросьте и повторите цикл |
| Все запросы < 1ms | Мало данных — OK для стенда |

## Критерии успеха

- [ ] `pg_stat_statements` установлен и возвращает строки
- [ ] JOIN query в top по total time после нагрузки
- [ ] Нашли индекс с низким `idx_scan` (если есть кандидат)
- [ ] Можете объяснить total vs mean exec time

## Дальше

PgBouncer: [15-pgbouncer.md](15-pgbouncer.md).
