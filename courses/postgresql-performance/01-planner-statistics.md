# 01. Планировщик и статистика

## Сценарий с работы

После ночного ETL в `events` выросла с 2M до 40M строк. Утром API отдаёт 503: тяжёлый отчёт по `device_id` внезапно делает **Seq Scan**. Индекс на месте, `ANALYZE` после загрузки забыли — планировщик думает, что в таблице ещё 2M строк и Index Scan «дороже». DBA запускает `ANALYZE perf.events` — план меняется, latency падает с 8s до 200ms.

Performance-курс начинается с **планировщика** и **статистики** — без этого EXPLAIN и индексы угадыванием.

**Предварительно:** [basic/09-indexes-explain](../postgresql-basic/09-indexes-explain.md), [intermediate/14-lab-monitoring](../postgresql-intermediate/14-lab-monitoring.md).  
**Стенд:** [`deploy/postgres`](../../deploy/postgres/README.md) — образ с `hypopg`.

## Что вы узнаете

- Как планировщик оценивает cost и selectivity
- `ANALYZE` vs `VACUUM`
- `statistics_target`, extended statistics
- Чтение `pg_stats` и расхождение estimate vs actual

## Как планировщик выбирает план

PostgreSQL строит дерево плана: Seq Scan, Index Scan, Hash Join, Nested Loop, Sort… Каждому узлу присваивается **cost** (условные единицы, не миллисекунды).

```text
cost = f(количество строк, selectivity, ширина строк, random_page_cost, cpu_operator_cost, ...)
```

Оценка строк берётся из **статистики** каталога `pg_statistic` (видна через `pg_stats`).

| Плохая статистика | Симптом |
|-------------------|---------|
| Устарела после bulk INSERT | Неверный Seq Scan / Index Scan |
| Низкий `statistics_target` | Плохая гистограмма на skewed data |
| Коррелированные колонки без extended stats | Неверный join order |

## ANALYZE

```sql
ANALYZE perf.events;
ANALYZE VERBOSE perf.events;
```

| | ANALYZE | VACUUM |
|---|---------|--------|
| Цель | Статистика для планировщика | Dead tuples, freeze |
| Блокировки | Лёгкие | Обычный VACUUM — не эксклюзивный |
| После bulk load | **Обязателен вручную** | Autovacuum позже |

Autovacuum вызывает ANALYZE по порогам, но **массовая загрузка** — всегда `ANALYZE` сразу после COMMIT.

## Параметры статистики

```sql
SHOW default_statistics_target;  -- often 100
```

```sql
ALTER TABLE perf.events ALTER COLUMN device_id SET STATISTICS 1000;
ANALYZE perf.events;
```

Выше target — точнее гистограмма, дольше ANALYZE, больше места в `pg_statistic`.

**Extended statistics** — корреляция колонок:

```sql
CREATE STATISTICS events_device_type (dependencies)
  ON device_id, event_type FROM perf.events;

ANALYZE perf.events;
```

Когда `device_id=42` почти всегда `event_type='error'` — без dependencies планировщик умножает selectivities независимо.

## Selectivity и pg_stats

```sql
SELECT attname, null_frac, avg_width, n_distinct, correlation
FROM pg_stats
WHERE schemaname = 'perf' AND tablename = 'events'
ORDER BY attname;
```

| Колонка | Интерпретация |
|---------|---------------|
| `n_distinct` | Оценка уникальных значений (-1 = unique) |
| `correlation` | Физический порядок vs логический (BRIN hint) |
| `null_frac` | Доля NULL |

Запрос `WHERE device_id = 42` при 1000 устройниках — ~0.1% строк **если равномерно**. Skew: одно device_id = 30% строк — нужна гистограмма с высоким target.

## EXPLAIN: estimate vs actual

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM perf.events
WHERE device_id = 42 AND event_type = 'error'
  AND created_at > now() - interval '7 days';
```

Сравните `rows=` (estimate) и `actual rows=` (ANALYZE). Разрыв в 10× — сигнал: ANALYZE, индекс, extended stats.

## Типичные ошибки

1. `CREATE INDEX` без последующего `ANALYZE` — планировщик не знает об индексе полноценно.
2. Поднять `statistics_target` на все колонки «на всякий случай» — долгий ANALYZE.
3. Смотреть только cost, игнорировать `actual rows`.
4. Путать VACUUM FULL с ANALYZE.

## Чек-лист

- [ ] ANALYZE vs VACUUM — разные задачи
- [ ] Когда увеличивать `statistics_target`
- [ ] Где смотреть гистограммы (`pg_stats`)
- [ ] estimate vs actual rows в EXPLAIN ANALYZE
- [ ] ANALYZE после bulk load

## Дальше

Лаба: [02-lab-analyze.md](02-lab-analyze.md).
