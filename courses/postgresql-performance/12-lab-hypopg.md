# 12. Лаба: hypopg → реальный индекс

## Зачем эта лаба

Полный цикл: baseline plan → hypopg → решение о `CREATE INDEX` → проверка после создания.

## Предусловия

- `perf.events` + `CREATE EXTENSION hypopg`
- Запрос с заметным Seq Scan

## Задание 1. План без индекса

Убедитесь, что нет индекса на `(device_id, created_at)`:

```sql
DROP INDEX IF EXISTS perf.events_device_created_idx;
ANALYZE perf.events;

EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM perf.events
WHERE device_id BETWEEN 10 AND 20
  AND created_at > now() - interval '14 days';
```

Запишите: Scan type, Execution Time, cost.

## Задание 2. Гипотетический индекс

```sql
SELECT indexrelid, indexname FROM hypopg_create_index(
  'CREATE INDEX ON perf.events (device_id, created_at)'
);

EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM perf.events
WHERE device_id BETWEEN 10 AND 20
  AND created_at > now() - interval '14 days';
```

Сравните cost и время. **Примечание:** на первом EXPLAIN с hypopg ANALYZE может ещё не использовать индекс полностью — смотрите узел плана.

```sql
SELECT * FROM hypopg_list_index;
SELECT hypopg_reset();
```

## Задание 3. Реальный индекс

Если выигрыш существенный:

```sql
CREATE INDEX events_device_created_idx
  ON perf.events (device_id, created_at);
-- prod: CREATE INDEX CONCURRENTLY ...

ANALYZE perf.events;

EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM perf.events
WHERE device_id BETWEEN 10 AND 20
  AND created_at > now() - interval '14 days';
```

## Задание 4. Таблица решения

| Этап | Index Scan? | Execution Time | Размер индекса |
|------|-------------|----------------|----------------|
| No index | | | — |
| hypopg only | | | 0 (virtual) |
| Real index | | | `pg_relation_size` |

```sql
SELECT pg_size_pretty(pg_relation_size('perf.events_device_created_idx'));
```

## Задание 5. Обоснование отказа (если индекс не нужен)

Если разница мала — напишите, почему **не** создавать индекс (write cost, rare query).

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| hypopg not available | Пересоберите deploy/postgres image |
| План не меняется | ANALYZE; запрос слишком селективен/мала таблица |
| hypopg_create_index error | Синтаксис DDL в строке |

## Критерии успеха

- [ ] План до/после hypopg сравнён
- [ ] hypopg_reset() выполнен
- [ ] Реальный индекс создан **или** отказ обоснован
- [ ] ANALYZE после CREATE INDEX

## Дальше

Финал: [13-final-project.md](13-final-project.md).
