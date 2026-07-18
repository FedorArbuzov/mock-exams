# 13. Мониторинг и slow queries

## Сценарий с работы

Grafana зелёная, пользователи кричат. CPU Postgres 90%, но **какой** запрос? `pg_stat_activity` показывает `idle in transaction` с 09:00. `pg_stat_statements` — один JOIN с `mean_exec_time` 4 секунды и 50k calls. Третий слой: `seq_scan` на `orders` вырос после релиза — регрессия в [pg_stat_user_tables](https://www.postgresql.org/docs/current/monitoring-stats.html).

Intermediate закрывает **наблюдаемость** Postgres до Prometheus/Grafana ([observability-basic](../observability-basic/README.md)).

## Что вы узнаете

- `pg_stat_activity` — кто, что, сколько ждёт
- `pg_stat_statements` — агрегат по нормализованным запросам
- Другие `pg_stat_*` для таблиц, индексов, replication
- Алерты и логи
- Отличие симптомов и инструментов

## pg_stat_activity — сейчас

```sql
SELECT pid, usename, application_name, state,
       wait_event_type, wait_event,
       now() - query_start AS query_age,
       now() - state_change AS state_age,
       left(query, 100) AS query
FROM pg_stat_activity
WHERE datname = current_database()
  AND pid <> pg_backend_pid()
ORDER BY query_start NULLS LAST;
```

| state | Действие |
|-------|----------|
| `active` | Выполняется — смотреть `wait_event`, `query` |
| `idle` | Ждёт клиента — OK |
| `idle in transaction` | **Опасно** — найти приложение, `pg_terminate_backend` после grace |
| `idle in transaction (aborted)` | После ошибки в txn — баг в app |

| wait_event_type | Примеры |
|-----------------|---------|
| `Lock` | Блокировка другим backend |
| `IO` | DataFileRead |
| `Client` | ClientRead — ждёт клиента |

Долгий active + `Lock` → [12-lab-mvcc](../postgresql-basic/12-lab-mvcc.md), `pg_locks`.

## pg_stat_statements

Расширение на стенде ([deploy/postgres](../../deploy/postgres/README.md)):

```sql
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

SELECT left(query, 80) AS q,
       calls,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       round(total_exec_time::numeric, 2) AS total_ms,
       rows
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
ORDER BY total_exec_time DESC
LIMIT 15;
```

| Метрика | Смысл |
|---------|-------|
| `mean_exec_time` | Среднее — outlier запросы |
| `total_exec_time` | calls × mean — главный виновник нагрузки |
| `stddev_exec_time` | Нестабильность |

Требует `shared_preload_libraries = 'pg_stat_statements'` в `postgresql.conf` (в compose стенда обычно уже).

Сброс статистики (осторожно):

```sql
SELECT pg_stat_statements_reset();
```

## Другие представления

| View | Что смотреть |
|------|--------------|
| `pg_stat_user_tables` | `seq_scan` vs `idx_scan`, `n_tup_ins/upd/del`, dead tuples |
| `pg_stat_user_indexes` | `idx_scan = 0` — мёртвый индекс |
| `pg_stat_database` | `xact_commit`, `deadlocks`, `temp_files` |
| `pg_stat_replication` | lag на primary |
| `pg_stat_subscription` | logical replication |

Регрессия после релиза:

```sql
SELECT relname, seq_scan, idx_scan, n_tup_ins
FROM pg_stat_user_tables
WHERE schemaname = 'shop'
ORDER BY seq_scan DESC;
```

Рост `seq_scan` на большой таблице — нет индекса или устарел `ANALYZE`.

## Экспорт в Prometheus

**postgres_exporter** — метрики connections, replication lag, bloat proxies, database size. Dashboards в [observability](../observability-basic/README.md).

Минимальные алерты:

- `connections` > 80% `max_connections`
- `replication lag` > порог (bytes или seconds)
- disk usage PGDATA > 85%
- `age(datfrozenxid)` близко к лимиту
- любой `idle in transaction` > 5 min
- `pg_stat_archiver failed_count` > 0

## Логи

`log_min_duration_statement` ([01-configuration](01-configuration.md)) + центральный сбор. Корреляция по `pg_stat_activity.pid` и `log_line_prefix '%p'`.

## pg_stat_activity vs pg_stat_statements

| | activity | statements |
|---|----------|------------|
| Горизонт | Сейчас | История с момента reset |
| Use case | Lock, stuck query | Top offenders, regressions |
| Overhead | Низкий | Низкий при разумном track |

## Типичные ошибки

1. Убивать random backend без проверки `application_name`.
2. Смотреть только mean, игнорировать total_exec_time.
3. Не сбрасывать/не учитывать deploy при сравнении «до/после».
4. Алерт только на CPU, не на lag и archiver.

## Чек-лист

- [ ] Действие при `idle in transaction`
- [ ] seq_scan растёт — 3 проверки (индекс, analyze, план)
- [ ] activity vs statements
- [ ] idx_scan = 0 — не единственный критерий удаления индекса
- [ ] 5 алертов для production Postgres

## Дальше

Лаба: [14-lab-monitoring.md](14-lab-monitoring.md).
