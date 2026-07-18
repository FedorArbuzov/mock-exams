# PostgreSQL — Performance (специализация)

Углублённый курс по **планировщику**, **JIT**, **auto_explain**, **индексам**, **pgbench** и **hypopg**.

**Формат:** мегакурс (~90–120 строк на урок). План: [`postgresql-path.md`](../postgresql-path.md).

**Предварительно:** [`postgresql-basic`](../postgresql-basic/README.md) (09–10), [`postgresql-intermediate`](../postgresql-intermediate/README.md) (13–14).

**Локально:** [`deploy/postgres`](../../deploy/postgres/README.md) — образ с `hypopg`, порт `5432`.

**Связанные курсы:** PgBouncer — [`postgresql-intermediate`](../postgresql-intermediate/15-pgbouncer.md).

## Программа

1. [Планировщик и статистика](01-planner-statistics.md)
2. [Лаба: ANALYZE и плохой план](02-lab-analyze.md)
3. [Параллельные запросы и JIT](03-parallel-jit.md)
4. [Лаба: JIT on/off](04-lab-jit.md)
5. [auto_explain и slow query log](05-auto-explain.md)
6. [Лаба: поймать slow query](06-lab-auto-explain.md)
7. [Индексы: BRIN, GiST, partial, INCLUDE](07-index-types-deep.md)
8. [Лаба: time-series events](08-lab-index-choice.md)
9. [Методология pgbench](09-pgbench-methodology.md)
10. [Лаба: tuning до/после](10-lab-pgbench-tuning.md)
11. [hypopg и виртуальные индексы](11-hypopg.md)
12. [Лаба: hypopg → реальный индекс](12-lab-hypopg.md)
13. [Финальный проект: отчёт tuning](13-final-project.md)

## Что должно получиться

- Читаете планы `EXPLAIN (ANALYZE, BUFFERS)` и объясняете выбор узла.
- Настраиваете `auto_explain` и интерпретируете TPS/latency из `pgbench`.
- Проверяете гипотетический индекс через `hypopg` перед `CREATE INDEX` на prod.
