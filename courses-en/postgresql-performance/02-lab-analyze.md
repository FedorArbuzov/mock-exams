# 02. Lab: ANALYZE and a bad plan

## Why this lab

You'll see the plan **before** and **after** `ANALYZE` on the `perf.events` table (~500k rows) and explain the estimate vs actual discrepancy — a fundamental performance-review skill.

## Prerequisites

- The Postgres environment is running
- The `psql` client

## Task 1. Prepare the schema

```bash
psql "postgresql://course:course@localhost:5432/course" \
  -f courses/postgresql-performance/examples/events-schema.sql
```

Or manually from the file [`examples/events-schema.sql`](examples/events-schema.sql) — schema `perf`, table `events`, 500k rows, **the file already ends with ANALYZE**.

For the "without statistics" experiment, create a copy:

```sql
CREATE TABLE perf.events_nostats (LIKE perf.events INCLUDING ALL);
INSERT INTO perf.events_nostats SELECT * FROM perf.events;
-- DO NOT run ANALYZE on events_nostats
```

## Task 2. Query without fresh statistics

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM perf.events_nostats
WHERE device_id = 42
  AND event_type = 'error'
  AND created_at > now() - interval '7 days';
```

Record in the table:

| Metric | Value |
|---------|----------|
| Scan node (Seq / Index) | |
| Planning Time | |
| Execution Time | |
| rows estimate | |
| actual rows | |
| Buffers: shared hit/read | |

## Task 3. ANALYZE

```sql
ANALYZE perf.events_nostats;
```

Repeat the same `EXPLAIN (ANALYZE, BUFFERS)`. Compare cost and time.

**Expectation:** estimates closer to actual; possibly a change of scan type.

## Task 4. Index (optional)

```sql
CREATE INDEX events_nostats_device_type_created_idx
  ON perf.events_nostats (device_id, event_type, created_at DESC);

ANALYZE perf.events_nostats;

EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM perf.events_nostats
WHERE device_id = 42 AND event_type = 'error'
  AND created_at > now() - interval '7 days';
```

**Expectation:** Index Scan or Bitmap Index Scan, lower Execution Time on a large result set.

## Task 5. Written explanation

In `analyze-lab-notes.md` (3–5 sentences):

- Why did the planner get it wrong before ANALYZE?
- What does a large estimate/actual gap mean?
- Is an index needed if a Seq Scan is fast after ANALYZE? (depends on selectivity and size)

## If something went wrong

| Symptom | Solution |
|---------|---------|
| Table is empty | Re-run events-schema.sql |
| Few rows — always Seq Scan | Normal on micro tables |
| INSERT is slow | 500k — wait 1–2 min |

## Success criteria

- [ ] Plan before and after ANALYZE captured
- [ ] estimate vs actual discrepancy explained
- [ ] If needed — index and improved time

## Next

Parallel and JIT: [03-parallel-jit.md](03-parallel-jit.md).
