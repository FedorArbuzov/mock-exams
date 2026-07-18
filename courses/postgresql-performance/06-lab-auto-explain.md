# 06. Лаба: поймать slow query в логах

## Зачем эта лаба

Полный цикл: сгенерировать медленный запрос → увидеть в `docker logs` → найти в `pg_stat_statements` → описать workflow on-call.

## Предусловия

- `perf.events` на месте
- `pg_stat_statements` ([intermediate/14](../postgresql-intermediate/14-lab-monitoring.md))

## Задание 1. auto_explain в сессии

```sql
LOAD 'auto_explain';
SET auto_explain.log_min_duration = '1ms';
SET auto_explain.log_analyze = on;
SET auto_explain.log_buffers = on;
```

## Задание 2. Медленный запрос (безопасный)

```sql
SELECT count(*) FROM perf.events WHERE pg_sleep(0.6) IS NOT NULL;
```

Альтернатива с нагрузкой (осторожно на больших таблицах):

```sql
SELECT count(*) FROM perf.events e1
CROSS JOIN perf.events e2
WHERE e1.id < 50 AND e2.id < 50;
```

## Задание 3. Проверка логов

```bash
docker logs mock-postgres 2>&1 | grep -E "duration:|EXPLAIN" | tail -30
```

**Ожидание:**

- строка `duration: ... ms` ≥ 500 (или ваш порог)
- блок `EXPLAIN` от auto_explain (если LOAD сработал)

Также проверьте глобальный порог:

```sql
SHOW log_min_duration_statement;
```

## Задание 4. pg_stat_statements

```sql
SELECT left(query, 100), calls,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       round(total_exec_time::numeric, 2) AS total_ms
FROM pg_stat_statements
WHERE query LIKE '%perf.events%'
ORDER BY total_exec_time DESC
LIMIT 5;
```

Найдите запрос с `pg_sleep` или cross join.

## Задание 5. Workflow document

`slow-query-workflow.md`:

```markdown
1. Alert: p99 latency / log threshold
2. pg_stat_statements: identify queryid
3. pg_stat_activity: active now?
4. Reproduce on staging with EXPLAIN (ANALYZE, BUFFERS)
5. Fix: index / rewrite / stats / vacuum
6. Verify: reset stats, deploy, monitor 24h
```

Заполните примером из этой лабы.

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Нет duration в логах | log_destination stderr; порог выше 600ms |
| auto_explain нет | LOAD в той же сессии; shared_preload |
| pg_sleep не в top | Выполните 10 раз подряд |

## Критерии успеха

- [ ] duration > 500ms в логах
- [ ] Запрос найден в pg_stat_statements
- [ ] Workflow описан в 6 шагах

## Дальше

Индексы deep dive: [07-index-types-deep.md](07-index-types-deep.md).
