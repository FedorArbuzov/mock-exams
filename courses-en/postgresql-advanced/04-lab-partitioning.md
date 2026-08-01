# 04. Lab: declarative partitioning

## Why this lab

You'll create a partitioned table `metrics`, fill it with data, see **pruning** in EXPLAIN, and compare `DROP PARTITION` with a bulk time-based DELETE.

## Prerequisites

- The [`deploy/postgres`](../../deploy/postgres/README.md) stand
- Connect as `course`

## Task 1. Parent and partitions

```sql
CREATE SCHEMA IF NOT EXISTS advanced_lab;

CREATE TABLE advanced_lab.metrics (
  id    bigserial,
  ts    timestamptz NOT NULL,
  value double precision
) PARTITION BY RANGE (ts);

CREATE TABLE advanced_lab.metrics_2026_w20 PARTITION OF advanced_lab.metrics
  FOR VALUES FROM ('2026-05-12') TO ('2026-05-19');

CREATE TABLE advanced_lab.metrics_2026_w21 PARTITION OF advanced_lab.metrics
  FOR VALUES FROM ('2026-05-19') TO ('2026-05-26');
```

Verification:

```sql
SELECT inhrelid::regclass AS partition
FROM pg_inherits
JOIN pg_class parent ON pg_inherits.inhparent = parent.oid
WHERE parent.relname = 'metrics';
```

## Task 2. Data

```sql
INSERT INTO advanced_lab.metrics (ts, value)
SELECT '2026-05-15'::timestamptz + (g || ' minutes')::interval,
       random()
FROM generate_series(1, 5000) g;

INSERT INTO advanced_lab.metrics (ts, value)
SELECT '2026-05-22'::timestamptz + (g || ' minutes')::interval,
       random()
FROM generate_series(1, 5000) g;
```

## Task 3. Partition pruning

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM advanced_lab.metrics
WHERE ts >= '2026-05-20' AND ts < '2026-05-26';
```

**Expected:** only `metrics_2026_w21` in the plan, not w20.

Compare with a query without a filter on `ts`:

```sql
EXPLAIN SELECT count(*) FROM advanced_lab.metrics;
```

**Both** partitions should be scanned (Append).

## Task 4. INSERT out of range

```sql
INSERT INTO advanced_lab.metrics (ts, value)
VALUES ('2026-01-01', 1.0);
```

**Expected:** `no partition of relation ... found for row`.

Create a default or the needed partition — fix it.

## Task 5. DROP vs DELETE

Measure the size of w20:

```sql
SELECT pg_size_pretty(pg_relation_size('advanced_lab.metrics_2026_w20'));
```

**Option A — DROP:**

```sql
DROP TABLE advanced_lab.metrics_2026_w20;
```

Instant. The parent no longer includes w20.

**Option B (if you didn't drop it)** — for comparison on a copy:

```sql
-- on a separate test table, not in prod
DELETE FROM advanced_lab.metrics WHERE ts < '2026-05-19';
-- + VACUUM — slow on large volumes
```

Write down the conclusion: when DROP is preferable.

## Task 6. Index on the parent

```sql
CREATE INDEX metrics_ts_idx ON advanced_lab.metrics (ts);

EXPLAIN SELECT * FROM advanced_lab.metrics
WHERE ts BETWEEN '2026-05-19' AND '2026-05-20';
```

The index is created on each remaining partition.

## If something goes wrong

| Symptom | Solution |
|---------|---------|
| No pruning | Condition not on `ts`; `constraint_exclusion` |
| DROP parent | DROP only child partitions |
| duplicate partition bound | Check the FROM/TO bounds |

## Success criteria

- [ ] EXPLAIN with a filter — one partition
- [ ] INSERT out of range — error (before fix)
- [ ] DROP partition performed
- [ ] You understand Append without a filter on the key

## Next

Extensions: [05-extensions.md](05-extensions.md).
