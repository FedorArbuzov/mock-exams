# 05. Расширения PostgreSQL

## Сценарий с работы

«Почему `LIKE '%widget%'` не использует индекс?» — Seq Scan на 10M products. `pg_trgm` + GIN решает fuzzy search. «Насколько раздута таблица?» — `n_dead_tup` врёт; `pgstattuple` показывает dead pages. «Отчёт из другого кластера» — `postgres_fdw` без ETL на Python.

Расширения — способ добавить функции **внутри** Postgres. В managed RDS не все доступны; на стенде mock-exams образ уже включает часть ([deploy/postgres](../../deploy/postgres/README.md)).

## Что вы узнаете

- Как ставить и где живут extensions
- pg_stat_statements — углублённое использование
- pg_trgm, pgstattuple, postgres_fdw
- pg_repack, pg_cron — ops-инструменты

## Установка

```sql
SELECT name, default_version, installed_version, comment
FROM pg_available_extensions
ORDER BY name;

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

| Вопрос | Ответ |
|--------|-------|
| Куда ставится? | В **текущую database**; объекты в schema (часто `public` или `extensions`) |
| Superuser? | Часто нужен для CREATE; на RDS — `rds_superuser` + allowlist |
| Upgrade PG | `ALTER EXTENSION name UPDATE` после major upgrade |

## pg_stat_statements

Уже в [intermediate/14-lab-monitoring](../postgresql-intermediate/14-lab-monitoring.md). Advanced-уровень:

```sql
SELECT queryid, calls, mean_exec_time, stddev_exec_time,
       rows, shared_blks_hit, shared_blks_read
FROM pg_stat_statements
WHERE queryid = 123456789;
```

Практики:

- `pg_stat_statements_reset()` после deploy — сравнение «до/после».
- `pg_stat_statements.save` — persist across restart (PG 14+).
- Нормализация скрывает literals — хорошо для агрегатов, плохо для ad-hoc debug.

Связь: [postgresql-performance](../postgresql-performance/README.md).

## pg_trgm — поиск по подстроке

```sql
CREATE EXTENSION pg_trgm;

CREATE INDEX products_name_trgm_idx ON shop.products
  USING gin (name gin_trgm_ops);

EXPLAIN ANALYZE
SELECT * FROM shop.products WHERE name ILIKE '%widget%';
```

| Подход | План |
|--------|------|
| `LIKE '%x%'` без trgm | Seq Scan |
| `LIKE 'prefix%'` | B-tree |
| `ILIKE '%x%'` + GIN trgm | Bitmap Index Scan на GIN |

Trade-off: GIN индекс крупный, INSERT медленнее.

Также: `similarity()`, `%` operator для fuzzy dedup.

## pgstattuple — точный bloat

```sql
CREATE EXTENSION pgstattuple;

SELECT * FROM pgstattuple('shop.orders');
-- tuple_percent, dead_tuple_percent, free_space ...
```

vs `n_dead_tup` из `pg_stat_user_tables` ([intermediate/11-vacuum-bloat](../postgresql-intermediate/11-vacuum-bloat.md)):

| | pg_stat | pgstattuple |
|---|---------|-------------|
| Стоимость | Дешёво | Читает таблицу — тяжело на больших |
| Точность | Оценка stats | Страницы heap |
| Когда | Мониторинг | Разовый анализ bloat |

## postgres_fdw — remote tables

```sql
CREATE EXTENSION postgres_fdw;

CREATE SERVER warehouse FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'warehouse.db', port '5432', dbname 'analytics');

CREATE USER MAPPING FOR course SERVER warehouse
  OPTIONS (user 'reader', password 'secret');

CREATE FOREIGN TABLE remote_orders (
  id bigint, created_at timestamptz, total numeric
) SERVER warehouse OPTIONS (schema_name 'shop', table_name 'orders');

SELECT count(*) FROM remote_orders WHERE created_at > now() - interval '1 day';
```

Use cases: federation, постепенная миграция, read из legacy DB.  
Минусы: latency, pushdown зависит от optimizer, нет join statistics remote.

## pg_repack / pg_cron

| Extension | Назначение |
|-----------|------------|
| **pg_repack** | Online rebuild table/index без VACUUM FULL lock |
| **pg_cron** | `SELECT cron.schedule('0 3 * * *', $$VACUUM ANALYZE shop.orders$$)` |

На RDS — проверьте allowlist. В K8s — образ с extensions ([14-lab-cloudnativepg](14-lab-cloudnativepg.md)).

## Типичные ошибки

1. `CREATE EXTENSION` в template1 «чтобы везде» — лучше явно per database + migration.
2. pg_trgm на каждую text колонку — раздувание индексов.
3. pgstattuple на 500 GB в пик — I/O storm.
4. FDW join больших таблиц без `use_remote_estimate` / statistics.

## Чек-лист

- [ ] EXTENSION привязан к database
- [ ] pg_trgm vs Seq Scan на `%...%`
- [ ] FDW use case (один пример)
- [ ] pgstattuple vs n_dead_tup
- [ ] Reset pg_stat_statements после deploy

## Дальше

Лаба: [06-lab-extensions.md](06-lab-extensions.md).
