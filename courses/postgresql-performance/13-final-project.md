# 13. Финальный проект: отчёт tuning

## Сценарий с работы

Performance review перед релизом: lead просит не «надо индексы», а **документ** с top queries, планами, измеренным эффектом и рисками. Этот проект — capstone `postgresql-performance` для условного shop/events сервиса на PG 16.

## Цель

Подготовить **Performance Tuning Report** (2–4 страницы markdown/PDF) с данными со стенда `perf.events` и pgbench.

## Предусловия

- Лабы 02, 06, 08, 10, 12 пройдены
- `pg_stat_statements`, `hypopg` доступны

## Структура отчёта

```text
docs/performance-tuning-report/
├── README.md
├── 01-executive-summary.md
├── 02-top-queries.md
├── 03-index-recommendations.md
├── 04-pgbench-results.md
├── 05-monitoring-config.md
└── 06-risks-and-followup.md
```

## Раздел 1. Executive summary

- Текущее состояние (latency, top bottleneck)
- 3 главные рекомендации одной строкой каждая
- Ожидаемый эффект (качественно)

## Раздел 2. Top-3 запроса

Из `pg_stat_statements`:

```sql
SELECT queryid, left(query, 120), calls,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       round(total_exec_time::numeric, 2) AS total_ms
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 3;
```

Для **каждого**:

1. `EXPLAIN (ANALYZE, BUFFERS)` — скрин или текст
2. Интерпретация: узкое место (Seq Scan, bad estimate, sort, JIT)
3. Root cause: stats, missing index, vacuum, query shape

## Раздел 3. Рекомендации

Шаблон:

| Query / area | Problem | Action | Expected gain | Risk |
|--------------|---------|--------|---------------|------|
| events by device | Seq Scan | composite index + ANALYZE | 10× read | INSERT slower |
| nightly aggregate | JIT overhead | jit=off for role report | lower CPU | — |
| errors report | full index large | partial index | smaller index | DDL window |

Минимум **3** рекомендации. Хотя бы одна проверена через **hypopg** ([12-lab-hypopg](12-lab-hypopg.md)).

## Раздел 4. pgbench

Таблица из [10-lab-pgbench-tuning](10-lab-pgbench-tuning.md):

| Этап | TPS | avg latency ms |
|------|-----|----------------|
| baseline | | |
| + change | | |

Укажите: `-c`, `-j`, `-T`, JIT on/off.

## Раздел 5. Мониторинг

- `log_min_duration_statement` — порог и риск шума
- `auto_explain` — `log_analyze` on/off для prod
- `pg_stat_statements` reset policy после deploy
- Алерты: top query total_time, seq_scan growth ([intermediate/13-monitoring](../postgresql-intermediate/13-monitoring.md))

## Раздел 6. Риски и follow-up

- JIT / parallel на OLTP ([03-parallel-jit](03-parallel-jit.md))
- Vacuum/bloat runbook link ([intermediate/11-vacuum-bloat](../postgresql-intermediate/11-vacuum-bloat.md))
- Индексы через миграции ([postgresql-developer](../postgresql-developer/README.md))
- RDS Performance Insights ([aws-intermediate](../aws-intermediate/README.md)) — если cloud

## Критерии приёмки

| Уровень | Критерии |
|---------|----------|
| Pass | 3 queries + EXPLAIN, 3 recommendations, pgbench table, monitoring section |
| Strong | hypopg evidence, partial/BRIN обоснован, risks quantified |
| Gap | Общие фразы без планов |

## Самопроверка

- [ ] Каждая рекомендация привязана к EXPLAIN или pg_stats
- [ ] Упомянут риск JIT на OLTP
- [ ] CONCURRENTLY для prod indexes
- [ ] Follow-up: ANALYZE после deploy

## Дальше

Смежные треки:

- [postgresql-ops](../postgresql-ops/README.md) — production backup/on-call
- [postgresql-developer](../postgresql-developer/README.md) — N+1, migrations
- [sqlalchemy-deep](../sqlalchemy-deep/README.md) — ORM query patterns

---

**postgresql-performance завершён.**
