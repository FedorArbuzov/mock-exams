# 11. VACUUM, bloat, autovacuum

## Сценарий с работы

Таблица `events` — 200 GB, `SELECT count(*)` — 5 млн строк. DBA в шоке: bloat после массовых UPDATE. Autovacuum «работает», но не успевает — три сессии BI в `idle in transaction` с утра ([basic/11-transactions-mvcc](../postgresql-basic/11-transactions-mvcc.md)). Другой кейс: `VACUUM FULL` в пик — сайт лёг на 40 минут эксклюзивной блокировки.

Vacuum — не «оптимизация для перфекционистов», а **обязательная** гигиена Postgres.

## Что вы узнаете

- Bloat и dead tuples
- `VACUUM` vs `VACUUM FULL` vs `VACUUM ANALYZE`
- Как autovacuum выбирает таблицы
- Per-table tuning для hot tables
- Freeze и transaction ID wraparound

## Bloat

UPDATE/DELETE оставляют **dead tuples** ([basic/11](../postgresql-basic/11-transactions-mvcc.md)). Они занимают место в таблице и индексах; Seq Scan проходит по ним.

```sql
SELECT schemaname, relname,
       n_live_tup, n_dead_tup,
       round(n_dead_tup::numeric / nullif(n_live_tup + n_dead_tup, 0), 3) AS dead_ratio,
       last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'shop'
ORDER BY n_dead_tup DESC;
```

| dead_ratio | Действие |
|------------|----------|
| < 0.05 | Норма на OLTP |
| 0.1–0.2 | Наблюдать |
| > 0.2 | Ручной VACUUM, tuning autovacuum, искать long transactions |

Точный bloat — `pgstattuple` extension; в ops — мониторинг размера vs live tuples.

## VACUUM

```sql
VACUUM (VERBOSE) shop.orders;
VACUUM (ANALYZE, VERBOSE) shop.orders;
```

| | Обычный VACUUM | VACUUM FULL |
|---|----------------|-------------|
| Блокировки | Краткие, не блокирует DML надолго | **ACCESS EXCLUSIVE** — таблица недоступна |
| Место на диске | Помечает страницы reusable | Возвращает OS (переписывает файл) |
| Когда | Постоянно / autovacuum | Редко, maintenance window |

`VACUUM FULL` на production таблице заказов в пик — антипаттерн. Альтернатива: `pg_repack` (extension), partition swap.

## Autovacuum

Launcher + workers. Порог для таблицы:

```text
vacuum threshold = autovacuum_vacuum_threshold +
                   autovacuum_vacuum_scale_factor * reltuples
```

Defaults: threshold 50, scale_factor 0.2 → на 1M строк vacuum после ~200k dead tuples.

Глобально:

```sql
SHOW autovacuum;
SHOW autovacuum_max_workers;
SHOW autovacuum_naptime;
```

**Почему не успевает:**

- long `idle in transaction`;
- mass UPDATE одной таблицы быстрее workers;
- `autovacuum_vacuum_cost_delay` слишком консервативен на SSD;
- anti-wraparound vacuum конкурирует за workers.

## Per-table tuning

Hot table `shop.orders`:

```sql
ALTER TABLE shop.orders SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_cost_delay = 2
);
```

Чаще vacuum/analyze при меньшем проценте мёртвых строк.

## Freeze и wraparound

Каждая транзакция имеет **XID** (32-bit). Старые версии строк должны быть **frozen**, иначе — катастрофический emergency vacuum.

```sql
SELECT datname, age(datfrozenxid) AS freeze_age
FROM pg_database
ORDER BY freeze_age DESC;
```

`autovacuum_freeze_max_age` — порог принудительного anti-wraparound. Симптом близости к лимиту — предупреждения в логах, aggressive autovacuum.

## pg_repack (preview)

Online rebuild таблицы без VACUUM FULL lock — если extension установлен ([ops](../postgresql-ops/README.md)). Не в базовом стенде по умолчанию.

## Типичные ошибки

1. Отключить autovacuum «на ночь для скорости» глобально.
2. `VACUUM FULL` как первая реакция на bloat.
3. Игнорировать `idle in transaction` в мониторинге.
4. Не запускать `ANALYZE` после bulk load — плохие планы ([performance](../postgresql-performance/README.md)).

## Чек-лист

- [ ] VACUUM vs VACUUM FULL
- [ ] Почему autovacuum не успевает (3 причины)
- [ ] dead_ratio > 0.2 — что делать
- [ ] wraparound — симптом и `age(datfrozenxid)`
- [ ] `VACUUM ANALYZE` после ручной чистки

## Дальше

Лаба: [12-lab-vacuum.md](12-lab-vacuum.md).
