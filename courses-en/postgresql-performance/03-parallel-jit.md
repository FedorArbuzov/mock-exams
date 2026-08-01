# 03. Parallel queries and JIT

## Scenario from work

The report `SELECT device_id, count(*), avg(...) FROM events GROUP BY device_id` on 80M rows — a single backend burns 100% CPU on a Seq Scan. **Parallel query** kicks in: `Gather` + 4 workers, and the time drops threefold. Another case: OLTP after a PG 15 upgrade — p99 latency went up; the culprit is **JIT**, compiling every tiny aggregate under an autovacuum-style workload.

Not every Postgres optimization helps every workload. Parallel — for analytics; JIT — for heavy expressions, not for point queries.

## What you'll learn

- Parallel query parameters and their EXPLAIN nodes
- JIT: when it kicks in and when it hurts
- Tuning for OLTP vs analytics
- Session-level `SET` for experiments

## Parallel query

Large Seq Scans, Hash Joins, and Aggregates can use **background workers**:

```sql
SHOW max_parallel_workers_per_gather;
SHOW max_parallel_workers;
SHOW min_parallel_table_scan_size;
```

In the plan:

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

| Parameter | Meaning |
|----------|-------|
| `max_parallel_workers_per_gather` | Workers per Gather node |
| `max_parallel_workers` | Worker limit per cluster |
| `parallel_setup_cost` | Threshold for "is parallel worth it" |
| `parallel_tuple_cost` | Cost of passing a tuple between workers |
| `min_parallel_table_scan_size` | Min table size for a parallel scan |

Parallel is **not** for tiny tables — the Gather overhead exceeds the gain.

Limitations: some plans (CTE materialized, subquery limits); `max_parallel_workers=0` disables it.

## JIT (Just-In-Time compilation)

PG 11+ compiles expressions via LLVM at high cost:

```sql
SHOW jit;
SHOW jit_above_cost;
SHOW jit_inline_above_cost;
SHOW jit_optimize_above_cost;
```

In `EXPLAIN (ANALYZE)`:

```text
JIT:
  Functions: 12
  Options: Inlining true, Optimization true, Expressions true, ...
  Timing: Generation 15.2 ms, Inlining 8.1 ms, ...
```

| Parameter | Meaning |
|----------|-------|
| `jit` | on/off globally |
| `jit_above_cost` | Total cost threshold for JIT |
| `jit_inline_above_cost` | Function inlining |
| `jit_optimize_above_cost` | Optimization |

## When JIT hurts

- Short OLTP: `SELECT * FROM orders WHERE id = $1` — JIT overhead > gain.
- Low `jit_above_cost` on prod — CPU spikes on "medium" queries.
- Many unique queries — compile thrashing.

Recommendation:

| Workload | Parallel | JIT |
|----------|----------|-----|
| OLTP API | default / moderate | `jit_above_cost` above default or off |
| Batch analytics | increase workers | on |
| pgbench point queries | often off for a clean test | **off** |

```sql
SET jit = off;  -- session
```

## Interaction with resources

Parallel workers = additional processes ([basic/01-architecture](../postgresql-basic/01-architecture.md)). On a CPU-bound VM, don't set `max_parallel_workers_per_gather = 16` on 4 cores.

## Common mistakes

1. JIT on + a pgbench TPS comparison — not representative.
2. Parallel on a replica for heavy reports without a limit — replication lag.
3. Changing 5 GUCs at once — unclear which one worked.
4. Ignoring the JIT Timing line in EXPLAIN.

## Checklist

- [ ] Gather / Parallel Seq Scan nodes in EXPLAIN
- [ ] `SET jit = off` for a session
- [ ] Why JIT doesn't help `SELECT 1`
- [ ] Parallel requires a sufficiently large table
- [ ] OLTP vs analytics — different tuning

## Next

Lab: [04-lab-jit.md](04-lab-jit.md).
