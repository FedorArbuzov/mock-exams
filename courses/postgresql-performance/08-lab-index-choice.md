# 08. Лаба: time-series events

## Зачем эта лаба

На одном отчётном запросе сравните **нет индекса**, **BRIN**, **partial B-tree** — таблица размер / время / план. Это типичное задание performance review для event store.

## Предусловия

- `perf.events` ~500k+ строк ([examples/events-schema.sql](examples/events-schema.sql))

## Запрос для всех экспериментов

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM perf.events
WHERE event_type = 'error'
  AND created_at >= now() - interval '30 days'
ORDER BY created_at DESC
LIMIT 100;
```

## Эксперимент 1. Baseline (без подходящего индекса)

Удалите индексы на `perf.events` кроме PK (осторожно):

```sql
DROP INDEX IF EXISTS perf.events_created_brin;
DROP INDEX IF EXISTS perf.events_errors_idx;
```

`ANALYZE perf.events;` — затем EXPLAIN.

Запишите: Scan type, Execution Time, Buffers.

## Эксперимент 2. BRIN на created_at

```sql
CREATE INDEX events_created_brin ON perf.events USING brin (created_at);
ANALYZE perf.events;
```

Повторите EXPLAIN. BRIN помогает range на time; фильтр `event_type` может быть filter в heap.

## Эксперимент 3. Partial index на errors

```sql
DROP INDEX IF EXISTS perf.events_created_brin;

CREATE INDEX events_errors_created_idx ON perf.events (created_at DESC)
WHERE event_type = 'error';

ANALYZE perf.events;
```

Повторите EXPLAIN.

**Ожидание:** Bitmap Index Scan / Index Scan, лучшее время на skew к `error`.

## Эксперимент 4. Размеры индексов

```sql
SELECT indexrelid::regclass AS index_name,
       pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_index
JOIN pg_class ON pg_class.oid = indexrelid
WHERE indrelid = 'perf.events'::regclass
  AND indexrelid::regclass::text NOT LIKE '%_pkey';
```

Или `\di+ perf.events*`

## Сводная таблица (заполните)

| Вариант | Индекс | Размер | Execution Time | Узел плана |
|---------|--------|--------|----------------|------------|
| 1. None | — | — | | |
| 2. BRIN | created_at | | | |
| 3. Partial | errors + created_at | | | |

## Задание 5. Рекомендация для prod

2–3 предложения:

- Какой индекс оставить?
- Нужно ли [partitioning](../postgresql-advanced/03-partitioning.md) при 10B строк?
- Риск INSERT при каждом новом error-index

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Мало error rows | Нормально; partial всё равно меньше |
| Все планы Seq Scan | Мало строк; снизьте LIMIT не поможет — нужен scale |
| DROP failed | Зависимости — DROP CONCURRENTLY не для BRIN drop issue |

## Критерии успеха

- [ ] Таблица сравнения заполнена
- [ ] Три EXPLAIN сохранены
- [ ] Рекомендация для prod написана

## Дальше

pgbench: [09-pgbench-methodology.md](09-pgbench-methodology.md).
