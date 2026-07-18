# 04. Лаба: JIT on/off

## Зачем эта лаба

На `perf.events` сравните тяжёлый `GROUP BY` с **JIT on**, **JIT off** и **parallel off** — три замера, один вывод для production policy.

## Предусловия

- `perf.events` загружена ([02-lab-analyze](02-lab-analyze.md))

## Задание 1. JIT принудительно on

```sql
SET jit = on;
SET jit_above_cost = 0;
SET max_parallel_workers_per_gather = 4;
\timing on

EXPLAIN (ANALYZE, BUFFERS)
SELECT device_id,
       count(*),
       sum(length(event_type)),
       avg((payload->>'v')::double precision)
FROM perf.events
GROUP BY device_id;
```

Запишите:

| | Значение |
|---|----------|
| Execution Time | |
| JIT Generation ms | |
| JIT total (если есть) | |
| Workers Used | |

## Задание 2. JIT off

```sql
SET jit = off;

EXPLAIN (ANALYZE, BUFFERS)
SELECT device_id,
       count(*),
       sum(length(event_type)),
       avg((payload->>'v')::double precision)
FROM perf.events
GROUP BY device_id;
```

## Задание 3. Parallel off

```sql
SET jit = off;
SET max_parallel_workers_per_gather = 0;

EXPLAIN (ANALYZE, BUFFERS)
SELECT device_id,
       count(*),
       sum(length(event_type)),
       avg((payload->>'v')::double precision)
FROM perf.events
GROUP BY device_id;
```

## Задание 4. Сводная таблица

| Конфигурация | Execution Time | Примечание |
|--------------|----------------|------------|
| JIT on, parallel 4 | | |
| JIT off, parallel 4 | | |
| JIT off, parallel 0 | | |

## Задание 5. Вывод (5 предложений)

`jit-policy-notes.md`:

- На вашем стенде JIT помог или мешал?
- Parallel дал ускорение?
- Рекомендация для OLTP connection pool (jit off?)
- Рекомендация для nightly batch job

```sql
RESET jit;
RESET jit_above_cost;
RESET max_parallel_workers_per_gather;
\timing off
```

## Если что-то пошло не так

| Симптом | Решение |
|---------|---------|
| Нет строки JIT | Таблица мала; jit_above_cost=0 |
| OOM / slow | Уменьшите данные или parallel workers |
| Идентичное время | CPU слишком быстрый на 500k — увеличьте scale |

## Критерии успеха

- [ ] Три замера выполнены
- [ ] Таблица сравнения заполнена
- [ ] Краткий вывод для prod policy

## Дальше

auto_explain: [05-auto-explain.md](05-auto-explain.md).
