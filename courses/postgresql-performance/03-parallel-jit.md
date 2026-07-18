# 03. Параллельные запросы и JIT

## Сценарий с работы

Отчёт `SELECT device_id, count(*), avg(...) FROM events GROUP BY device_id` на 80M строк — один backend жрёт CPU 100% на Seq Scan. Включается **parallel query**: `Gather` + 4 workers, время падает втрое. Другой кейс: OLTP после апгрейда PG 15 — p99 latency вырос; виноват **JIT**, компилирующий каждый мелкий aggregate в autovacuum-стиле нагрузке.

Не каждая оптимизация Postgres помогает всем workload. Parallel — для аналитики; JIT — для тяжёлых выражений, не для point queries.

## Что вы узнаете

- Параметры parallel query и узлы в EXPLAIN
- JIT: когда включается и когда вреден
- Настройка для OLTP vs analytics
- `SET` на уровне сессии для экспериментов

## Parallel query

Большие Seq Scan, Hash Join, Aggregate могут использовать **background workers**:

```sql
SHOW max_parallel_workers_per_gather;
SHOW max_parallel_workers;
SHOW min_parallel_table_scan_size;
```

В плане:

```text
Gather
  Workers Planned: 4
  -> Parallel Seq Scan on events
```

```sql
SET max_parallel_workers_per_gather = 4;

EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*), avg((payload->>'v')::float)
FROM perf.events;
```

| Параметр | Смысл |
|----------|-------|
| `max_parallel_workers_per_gather` | Workers на один Gather node |
| `max_parallel_workers` | Лимит workers в кластере |
| `parallel_setup_cost` | Порог «стоит ли parallel» |
| `parallel_tuple_cost` | Стоимость передачи tuple между workers |
| `min_parallel_table_scan_size` | Мин. размер таблицы для parallel scan |

Parallel **не** для tiny tables — overhead Gather больше выигрыша.

Ограничения: некоторые планы (CTE materialized, subquery limits), `max_parallel_workers=0` отключает.

## JIT (Just-In-Time compilation)

PG 11+ компилирует выражения через LLVM при высоком cost:

```sql
SHOW jit;
SHOW jit_above_cost;
SHOW jit_inline_above_cost;
SHOW jit_optimize_above_cost;
```

В `EXPLAIN (ANALYZE)`:

```text
JIT:
  Functions: 12
  Options: Inlining true, Optimization true, Expressions true, ...
  Timing: Generation 15.2 ms, Inlining 8.1 ms, ...
```

| Параметр | Смысл |
|----------|-------|
| `jit` | on/off глобально |
| `jit_above_cost` | Порог total cost для JIT |
| `jit_inline_above_cost` | Inline функций |
| `jit_optimize_above_cost` | Оптимизация |

## Когда JIT вреден

- Короткие OLTP: `SELECT * FROM orders WHERE id = $1` — JIT overhead > выигрыш.
- Низкий `jit_above_cost` на prod — CPU spikes на «средних» запросах.
- Много уникальных запросов — compile thrashing.

Рекомендация:

| Workload | Parallel | JIT |
|----------|----------|-----|
| OLTP API | default / умеренно | `jit_above_cost` выше default или off |
| Batch analytics | увеличить workers | on |
| pgbench point queries | часто off для чистоты теста | **off** |

```sql
SET jit = off;  -- сессия
```

## Взаимодействие с ресурсами

Parallel workers = дополнительные процессы ([basic/01-architecture](../postgresql-basic/01-architecture.md)). На CPU-bound VM не ставьте `max_parallel_workers_per_gather = 16` на 4 cores.

## Типичные ошибки

1. JIT on + pgbench TPS сравнение — нерепрезентативно.
2. Parallel на реплике для тяжётых отчётов без лимита — lag replication.
3. Менять 5 GUC сразу — непонятно, что сработало.
4. Игнорировать строку JIT Timing в EXPLAIN.

## Чек-лист

- [ ] Узлы Gather / Parallel Seq Scan в EXPLAIN
- [ ] `SET jit = off` для сессии
- [ ] Почему JIT не помогает `SELECT 1`
- [ ] Parallel требует достаточно большой таблицы
- [ ] OLTP vs analytics — разная настройка

## Дальше

Лаба: [04-lab-jit.md](04-lab-jit.md).
