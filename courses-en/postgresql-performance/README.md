# PostgreSQL — Performance (specialization)

An in-depth course on the **planner**, **JIT**, **auto_explain**, **indexes**, **pgbench**, and **hypopg**.

**Format:** megacourse (~90–120 lines per lesson). Plan: [`postgresql-path.md`](../postgresql-path.md).

**Prerequisites:** [`postgresql-basic`](../postgresql-basic/README.md) (09–10), [`postgresql-intermediate`](../postgresql-intermediate/README.md) (13–14).

**Locally:** [`deploy/postgres`](../../deploy/postgres/README.md) — image with `hypopg`, port `5432`.

**Related courses:** PgBouncer — [`postgresql-intermediate`](../postgresql-intermediate/15-pgbouncer.md).

## Curriculum

1. [Planner and statistics](01-planner-statistics.md)
2. [Lab: ANALYZE and a bad plan](02-lab-analyze.md)
3. [Parallel queries and JIT](03-parallel-jit.md)
4. [Lab: JIT on/off](04-lab-jit.md)
5. [auto_explain and the slow query log](05-auto-explain.md)
6. [Lab: catch a slow query](06-lab-auto-explain.md)
7. [Indexes: BRIN, GiST, partial, INCLUDE](07-index-types-deep.md)
8. [Lab: time-series events](08-lab-index-choice.md)
9. [pgbench methodology](09-pgbench-methodology.md)
10. [Lab: tuning before/after](10-lab-pgbench-tuning.md)
11. [hypopg and virtual indexes](11-hypopg.md)
12. [Lab: hypopg → real index](12-lab-hypopg.md)
13. [Final project: tuning report](13-final-project.md)

## What you should end up with

- Read `EXPLAIN (ANALYZE, BUFFERS)` plans and explain the node choice.
- Configure `auto_explain` and interpret TPS/latency from `pgbench`.
- Validate a hypothetical index with `hypopg` before `CREATE INDEX` on prod.
