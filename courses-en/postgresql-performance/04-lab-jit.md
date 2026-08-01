# 04. Lab: JIT on/off

## Why this lab

On `perf.events`, compare a heavy `GROUP BY` with **JIT on**, **JIT off**, and **parallel off** — three measurements, one conclusion for a production policy.

## Prerequisites

- `perf.events` is loaded ([02-lab-analyze](02-lab-analyze.md))

## Task 1. JIT forced on

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

Record:

| | Value |
|---|----------|
| Execution Time | |
| JIT Generation ms | |
| JIT total (if present) | |
| Workers Used | |

## Task 2. JIT off

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

## Task 3. Parallel off

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

## Task 4. Summary table

| Configuration | Execution Time | Note |
|--------------|----------------|------------|
| JIT on, parallel 4 | | |
| JIT off, parallel 4 | | |
| JIT off, parallel 0 | | |

## Task 5. Conclusion (5 sentences)

`jit-policy-notes.md`:

- On your environment, did JIT help or hurt?
- Did parallel give a speedup?
- Recommendation for an OLTP connection pool (jit off?)
- Recommendation for a nightly batch job

```sql
RESET jit;
RESET jit_above_cost;
RESET max_parallel_workers_per_gather;
\timing off
```

## If something went wrong

| Symptom | Solution |
|---------|---------|
| No JIT line | Table too small; jit_above_cost=0 |
| OOM / slow | Reduce data or parallel workers |
| Identical time | CPU too fast on 500k — increase scale |

## Success criteria

- [ ] Three measurements taken
- [ ] Comparison table filled in
- [ ] Short conclusion for a prod policy

## Next

auto_explain: [05-auto-explain.md](05-auto-explain.md).
