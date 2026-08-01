# 13. Final project: tuning report

## Scenario from work

A performance review before a release: the lead asks not for "we need indexes" but for a **document** with the top queries, plans, measured effect, and risks. This project is the capstone of `postgresql-performance` for a hypothetical shop/events service on PG 16.

## Goal

Prepare a **Performance Tuning Report** (2–4 pages of markdown/PDF) with data from the `perf.events` environment and pgbench.

## Prerequisites

- Labs 02, 06, 08, 10, 12 completed
- `pg_stat_statements`, `hypopg` available

## Report structure

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

## Section 1. Executive summary

- Current state (latency, top bottleneck)
- 3 main recommendations, one line each
- Expected effect (qualitatively)

## Section 2. Top-3 queries

From `pg_stat_statements`:

```sql
SELECT queryid, left(query, 120), calls,
       round(mean_exec_time::numeric, 2) AS mean_ms,
       round(total_exec_time::numeric, 2) AS total_ms
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 3;
```

For **each one**:

1. `EXPLAIN (ANALYZE, BUFFERS)` — screenshot or text
2. Interpretation: the bottleneck (Seq Scan, bad estimate, sort, JIT)
3. Root cause: stats, missing index, vacuum, query shape

## Section 3. Recommendations

Template:

| Query / area | Problem | Action | Expected gain | Risk |
|--------------|---------|--------|---------------|------|
| events by device | Seq Scan | composite index + ANALYZE | 10× read | INSERT slower |
| nightly aggregate | JIT overhead | jit=off for role report | lower CPU | — |
| errors report | full index large | partial index | smaller index | DDL window |

At least **3** recommendations. At least one validated via **hypopg** ([12-lab-hypopg](12-lab-hypopg.md)).

## Section 4. pgbench

Table from [10-lab-pgbench-tuning](10-lab-pgbench-tuning.md):

| Stage | TPS | avg latency ms |
|------|-----|----------------|
| baseline | | |
| + change | | |

State: `-c`, `-j`, `-T`, JIT on/off.

## Section 5. Monitoring

- `log_min_duration_statement` — threshold and noise risk
- `auto_explain` — `log_analyze` on/off for prod
- `pg_stat_statements` reset policy after a deploy
- Alerts: top query total_time, seq_scan growth ([intermediate/13-monitoring](../postgresql-intermediate/13-monitoring.md))

## Section 6. Risks and follow-up

- JIT / parallel on OLTP ([03-parallel-jit](03-parallel-jit.md))
- Vacuum/bloat runbook link ([intermediate/11-vacuum-bloat](../postgresql-intermediate/11-vacuum-bloat.md))
- Indexes via migrations ([postgresql-developer](../postgresql-developer/README.md))
- RDS Performance Insights ([aws-intermediate](../aws-intermediate/README.md)) — if cloud

## Success criteria

| Level | Criteria |
|---------|----------|
| Pass | 3 queries + EXPLAIN, 3 recommendations, pgbench table, monitoring section |
| Strong | hypopg evidence, partial/BRIN justified, risks quantified |
| Gap | Generic phrases without plans |

## Self-check

- [ ] Each recommendation tied to an EXPLAIN or pg_stats
- [ ] JIT risk on OLTP mentioned
- [ ] CONCURRENTLY for prod indexes
- [ ] Follow-up: ANALYZE after a deploy

## Next

Adjacent tracks:

- [postgresql-ops](../postgresql-ops/README.md) — production backup/on-call
- [postgresql-developer](../postgresql-developer/README.md) — N+1, migrations
- [sqlalchemy-deep](../sqlalchemy-deep/README.md) — ORM query patterns

---

**postgresql-performance complete.**
