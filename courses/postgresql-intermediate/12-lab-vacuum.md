# 12. Лаба: bloat и autovacuum

## Зачем эта лаба

Вы **намеренно** создадите dead tuples, увидите рост `n_dead_tup`, выполните `VACUUM (VERBOSE)` и сравните статистику до/после. Это ответ на тикет «таблица раздулась, autovacuum не помогает» — с цифрами из `pg_stat_user_tables`.

## Предусловия

- `shop.orders` с данными (желательно ≥ 10k строк из [basic/10-lab-indexes](../postgresql-basic/10-lab-indexes.md)).
- Подключение как `course`.

## Задание 1. Baseline

```sql
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, last_vacuum
FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'orders';

SELECT pg_size_pretty(pg_relation_size('shop.orders')) AS heap_size;
```

Запишите `n_dead_tup` и размер.

## Задание 2. Нагрузка dead tuples

Вариант A — массовый no-op UPDATE:

```sql
UPDATE shop.orders SET qty = qty WHERE id <= 10000;
```

Вариант B — цикл (если мало строк):

```sql
DO $$
BEGIN
  FOR i IN 1..200 LOOP
    UPDATE shop.orders SET qty = qty WHERE id = 1;
  END LOOP;
END $$;
```

Снова статистика:

```sql
SELECT n_live_tup, n_dead_tup,
       round(n_dead_tup::numeric / nullif(n_live_tup + n_dead_tup, 0), 3) AS dead_ratio
FROM pg_stat_user_tables
WHERE relname = 'orders';
```

**Ожидание:** `n_dead_tup` вырос.

## Задание 3. Ручной VACUUM

```sql
VACUUM (VERBOSE, ANALYZE) shop.orders;
```

В выводе VERBOSE (в psql) ищите `dead tuples`, `pages removed` / `pages remain`.

После:

```sql
SELECT n_dead_tup, last_vacuum, last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
WHERE relname = 'orders';
```

**Ожидание:** `n_dead_tup` снизился, `last_vacuum` обновился.

## Задание 4. Размер после VACUUM

```sql
SELECT pg_size_pretty(pg_relation_size('shop.orders')) AS heap_size_after;
```

Обычный VACUUM **не** всегда уменьшает файл на диске — место переиспользуется внутри. Сильное уменьшение — только `VACUUM FULL` / pg_repack.

## Задание 5. Autovacuum per-table (опционально)

```sql
ALTER TABLE shop.orders SET (
  autovacuum_vacuum_scale_factor = 0.01
);
```

Повторите UPDATE из задания 2. Подождите 1–2 минуты или снизьте на стенде:

```sql
ALTER SYSTEM SET autovacuum_naptime = '10s';
SELECT pg_reload_conf();
```

Проверьте `last_autovacuum` — мог сработать worker без ручного VACUUM.

**После лабы** верните naptime к default при желании.

## Задание 6. Freeze age (просмотр)

```sql
SELECT datname, age(datfrozenxid) FROM pg_database;
```

На учебном стенде age маленький. Запомните запрос для production мониторинга.

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| n_dead_tup не растёт | HOT update оптимизация; UPDATE меняющий колонку; больше строк |
| VACUUM instant | Мало dead tuples |
| Нет VERBOSE output | Запускайте в psql, не через `-c` без клиента |

## Критерии успеха

- [ ] Видели рост `n_dead_tup` до VACUUM
- [ ] `VACUUM (VERBOSE, ANALYZE)` выполнен
- [ ] `n_dead_tup` снизился после VACUUM
- [ ] Понимаете, почему файл не всегда shrink

## Дальше

Мониторинг: [13-monitoring.md](13-monitoring.md).
