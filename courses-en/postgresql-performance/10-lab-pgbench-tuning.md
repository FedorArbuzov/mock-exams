# 10. Lab: pgbench before/after

## Why this lab

Capture a **baseline** TPS/latency and change **one** variable (an index or a GUC) — as in [09-pgbench-methodology](09-pgbench-methodology.md).

## Prerequisites

- `pgbench` in PATH or in the Postgres container
- `perf.events` or readiness to init the pgbench schema

## Task 1. Baseline

```bash
bash courses/postgresql-performance/examples/pgbench-run.sh
```

Or manually:

```bash
export URL="postgresql://course:course@localhost:5432/course"
pgbench -i -s 5 "$URL"
pgbench -c 10 -j 2 -T 30 -P 5 "$URL"
```

Record:

| Metric | Value |
|---------|----------|
| TPS | |
| latency average ms | |
| latency stddev ms | |
| clients / threads | |

Repeat **3 times** and take the median TPS.

```sql
SET jit = off;  -- in a separate session before the runs, or ALTER SYSTEM for the lab
```

## Task 2. Index for a custom query

On `perf.events`:

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

Compare with the same script **before** the index (save the old numbers).

## Task 3. One GUC (carefully)

Only if the parameter doesn't require a restart, or restart the container deliberately:

```sql
ALTER SYSTEM SET random_page_cost = 1.1;  -- SSD hint, example
SELECT pg_reload_conf();
```

Or `shared_buffers` (requires a restart):

```bash
docker compose -f deploy/postgres/docker-compose.yml restart postgres
```

**One** parameter. Repeat the same pgbench.

## Task 4. Report

| Stage | TPS (median) | avg latency ms | Change |
|------|--------------|----------------|-----------|
| baseline TPC-B | | | — |
| + device_id index (custom) | | | |
| + GUC tweak | | | |

Conclusion (3 sentences): what had the largest effect; what not to touch on prod without measuring.

## If something went wrong

| Symptom | Solution |
|---------|---------|
| pgbench not found | `docker run --rm -it postgres:16 pgbench ...` |
| FATAL too many clients | Lower `-c` |
| TPS 0 | URL, auth, init `-i` |

## Success criteria

- [ ] ≥ 2 runs with fixed `-c -j -T`
- [ ] Median TPS recorded
- [ ] One change isolated
- [ ] Conclusion on what worked

## Next

hypopg: [11-hypopg.md](11-hypopg.md).
