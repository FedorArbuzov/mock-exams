# 10. Лаба: pgbench до/после

## Зачем эта лаба

Зафиксируйте **baseline** TPS/latency и измените **одну** переменную (индекс или GUC) — как в [09-pgbench-methodology](09-pgbench-methodology.md).

## Предусловия

- `pgbench` в PATH или в контейнере Postgres
- `perf.events` или готовность init pgbench schema

## Задание 1. Baseline

```bash
bash courses/postgresql-performance/examples/pgbench-run.sh
```

Или вручную:

```bash
export URL="postgresql://course:course@localhost:5432/course"
pgbench -i -s 5 "$URL"
pgbench -c 10 -j 2 -T 30 -P 5 "$URL"
```

Запишите:

| Метрика | Значение |
|---------|----------|
| TPS | |
| latency average ms | |
| latency stddev ms | |
| clients / threads | |

Повторите **3 раза**, возьмите медиану TPS.

```sql
SET jit = off;  -- в отдельной сессии перед runs, или ALTER SYSTEM для лабы
```

## Задание 2. Индекс под custom query

На `perf.events`:

```sql
CREATE INDEX IF NOT EXISTS events_device_idx ON perf.events (device_id);
ANALYZE perf.events;
```

Custom script `pgbench-events.sql`:

```sql
\set device_id random(1, 1000)
SELECT count(*) FROM perf.events WHERE device_id = :device_id;
```

```bash
pgbench -f courses/postgresql-performance/examples/pgbench-events.sql \
  -c 10 -j 2 -T 30 -M prepared "$URL"
```

Сравните с тем же скриптом **до** индекса (сохраните старые цифры).

## Задание 3. Один GUC (осторожно)

Только если параметр не требует restart, или перезапустите контейнер осознанно:

```sql
ALTER SYSTEM SET random_page_cost = 1.1;  -- SSD hint, пример
SELECT pg_reload_conf();
```

Или `shared_buffers` (требует restart):

```bash
docker compose -f deploy/postgres/docker-compose.yml restart postgres
```

**Один** параметр. Повторите тот же pgbench.

## Задание 4. Отчёт

| Этап | TPS (median) | avg latency ms | Изменение |
|------|--------------|----------------|-----------|
| baseline TPC-B | | | — |
| + device_id index (custom) | | | |
| + GUC tweak | | | |

Вывод (3 предложения): что дало наибольший эффект; что не трогать на prod без измерения.

## Если что-то пошло не wrong

| Симптом | Решение |
|---------|---------|
| pgbench not found | `docker run --rm -it postgres:16 pgbench ...` |
| FATAL too many clients | Снизить `-c` |
| TPS 0 | URL, auth, init `-i` |

## Критерии успеха

- [ ] ≥ 2 прогона с фиксированными `-c -j -T`
- [ ] Медиана TPS записана
- [ ] Одно изменение изолировано
- [ ] Вывод что сработало

## Дальше

hypopg: [11-hypopg.md](11-hypopg.md).
