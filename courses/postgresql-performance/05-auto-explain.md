# 05. auto_explain и slow query log

## Сценарий с работы

`pg_stat_statements` показывает: запрос X — 40% `total_exec_time`. Вы воспроизводите в psql — 50ms. В проде в 3 ночи — 8 секунд. Без **плана в момент деградации** вы гадаете. **auto_explain** логирует `EXPLAIN` для медленных выполнений; `log_min_duration_statement` — текст SQL.

Три инструмента — одна цепочка расследования ([intermediate/13-monitoring](../postgresql-intermediate/13-monitoring.md)).

## Что вы узнаете

- `log_min_duration_statement` в Docker и prod
- `auto_explain` в сессии и через preload
- Workflow: pg_stat_statements → reproduce → EXPLAIN
- Риски `log_analyze` на production

## log_min_duration_statement

На стенде часто уже в compose:

```ini
log_min_duration_statement = 500   # milliseconds
```

```sql
SHOW log_min_duration_statement;
```

Логи:

```bash
docker logs mock-postgres 2>&1 | tail -50
```

Формат (зависит от `log_line_prefix`):

```text
2026-06-25 10:00:00 UTC [12345]: duration: 612.345 ms  statement: SELECT ...
```

| Порог | Когда |
|-------|-------|
| 500ms | Старт для OLTP |
| 100ms | Шумно на busy API |
| 0 | Все запросы — только debug на стенде |

Корреляция с `pg_stat_activity.pid` через `%p` в prefix.

## auto_explain

Логирует **план** медленных запросов автоматически.

**В сессии (лаба):**

```sql
LOAD 'auto_explain';
SET auto_explain.log_min_duration = '200ms';
SET auto_explain.log_analyze = on;
SET auto_explain.log_buffers = on;
SET auto_explain.log_verbose = off;
```

**Постоянно (postgresql.conf):**

```ini
shared_preload_libraries = 'pg_stat_statements, auto_explain'
auto_explain.log_min_duration = 500ms
auto_explain.log_analyze = on
auto_explain.log_buffers = on
auto_explain.log_nested_statements = on
```

Требует **restart** для preload.

| Опция | Смысл |
|-------|-------|
| `log_analyze` | Реально выполняет — **двойная стоимость** на prod |
| `log_buffers` | Buffers в плане |
| `log_triggers` | Время триггеров |
| `sample_rate` | Доля запросов (снижение шума) |

## Связка инструментов

```text
1. pg_stat_statements → top query by total_exec_time
2. Нормализованный текст → reproduce с параметрами
3. EXPLAIN (ANALYZE, BUFFERS) в staging
4. auto_explain в prod → план при реальной деградации (без ручного reproduce)
5. log_min_duration → точный SQL с literals/timestamps
```

| Инструмент | Даёт |
|------------|------|
| `pg_stat_statements` | Агрегат, calls, mean, total |
| `log_min_duration_statement` | Текст конкретного медленного run |
| `auto_explain` | План того же run |

## Риски на production

| Риск | Митигация |
|------|-----------|
| `log_analyze = on` | Запрос выполняется дважды; sample_rate; только staging |
| Объём логов | Порог 500ms–1s; central log retention |
| PII в statement log | `log_statement` off для всех; masking |

Для prod часто: `log_analyze = off` в auto_explain, только plan estimates; полный ANALYZE в staging.

## Типичные ошибки

1. Включить auto_explain с 1ms threshold на prod — диск логов.
2. Искать план только в pg_stat_statements — его там нет.
3. Забыть `shared_preload_libraries` — LOAD только per session.
4. Не смотреть docker logs / journal при «медленно».

## Чек-лист

- [ ] auto_explain vs ручной EXPLAIN
- [ ] Риск `log_analyze = on`
- [ ] Где логи в Docker
- [ ] Workflow расследования из 4 шагов
- [ ] Порог log_min_duration для вашего SLA

## Дальше

Лаба: [06-lab-auto-explain.md](06-lab-auto-explain.md).
