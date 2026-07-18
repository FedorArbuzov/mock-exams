# 09. Методология pgbench

## Сценарий с работы

«Мы подняли `shared_buffers` — TPS вырос на 40%» — но тест был 10 секунд, cold cache, и одновременно включили JIT. Вторая команда гоняет `pgbench -c 200` на laptop без pooler и публикует «Postgres выдерживает 50k TPS». **pgbench** — инструмент, не истина; методология решает.

Курс использует pgbench для **до/после** одного изменения, не для маркетинга.

## Что вы узнаете

- Флаги pgbench и scale factor
- Типичные ошибки бенчмаркинга
- Связь с PgBouncer и JIT
- Custom scripts

## Что измеряет pgbench

Встроенный бенчмарк: **TPS** (transactions per second), **latency** (avg, stddev, иногда percentiles в новых версиях).

```bash
pgbench -i -s 10 "postgresql://course:course@localhost:5432/course"
pgbench -c 10 -j 2 -T 60 "postgresql://course:course@localhost:5432/course"
```

| Флаг | Смысл |
|------|-------|
| `-i` | Init — создать схему `pgbench_*` |
| `-s scale` | Множитель ~100k строк accounts (scale 10 ≈ 1M) |
| `-c clients` | Число подключений (= конкуренция) |
| `-j threads` | Клиентские потоки (≤ cores обычно) |
| `-T seconds` | Длительность run |
| `-P sec` | Progress report |
| `-M prepared` | Prepared statements (реалистичнее для ORM) |

Стандартный workload — упрощённый TPC-B (mix SELECT/UPDATE/INSERT).

## Методология честного теста

```text
1. Фиксируйте: -c, -j, -T, -M, hardware, PG version
2. Warm-up: отдельный run 30s не считать
3. Минимум 3 прогона, берите медиану
4. Один параметр за итерацию (index OR shared_buffers OR jit)
5. SET jit = off для OLTP-like сравнения
6. Смотрите latency stddev, не только TPS
7. Записывайте cache state (restart vs steady)
```

## Типичные ошибки

| Ошибка | Почему плохо |
|--------|--------------|
| Cold cache первый run | Завышенный эффект «тюнинга» |
| `-c` >> CPU cores | Context switch, не throughput Postgres |
| Менять 3 GUC сразу | Непонятно, что помогло |
| Игнорировать p99 latency | TPS OK, пользователи страдают |
| Docker on Mac latency | Не сравнивать с bare metal prod |
| Без pooler при 100+ clients | `too many connections` |

## Связь с PgBouncer

При `-c 50` сравните:

```bash
pgbench -c 50 -j 4 -T 30 "postgresql://course:course@localhost:5432/course"
pgbench -c 50 -j 4 -T 30 "postgresql://course:course@localhost:6432/course"
```

См. [intermediate/16-lab-pgbouncer](../postgresql-intermediate/16-lab-pgbouncer.md).

## Custom script

```bash
pgbench -f custom.sql -c 5 -T 20 -M prepared URL
```

`custom.sql`:

```sql
\set device_id random(1, 1000)
SELECT count(*) FROM perf.events WHERE device_id = :device_id;
```

Полезно тестировать **ваши** запросы, не только TPC-B.

## Интерпретация результатов

```text
transaction type: <builtin: TPC-B (sort of)>
scaling factor: 10
query mode: simple
number of clients: 10
number of threads: 2
duration: 30 s
number of transactions actually processed: 45231
latency average = 6.612 ms
latency stddev = 3.104 ms
tps = 1507.234567 (including connections establishing)
```

TPS падает при росте `-c` без pool — закон Little + lock contention.

## Типичные ошибки (prod)

Публиковать pgbench TPS как «ёмкость API» без учёта JOIN, ORM, network.

## Чек-лист

- [ ] Scale factor — что означает
- [ ] Почему TPS падает при росте `-c` без pool
- [ ] Зачем 3+ прогона
- [ ] JIT off для OLTP benchmark
- [ ] Custom script для своих запросов

## Дальше

Лаба: [10-lab-pgbench-tuning.md](10-lab-pgbench-tuning.md).
