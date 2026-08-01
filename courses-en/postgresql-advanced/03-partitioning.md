# 03. Table partitioning

## Real-world scenario

The `events` table — 400 GB, 2 billion rows. `DELETE FROM events WHERE created_at < now() - interval '90 days'` — 18 hours, bloat, replication lag. `VACUUM` can't keep up. The architect proposes partitioning by month: `DROP TABLE events_2024_01` — seconds.

**Declarative partitioning** (PG 10+) — the standard for time-series and large OLTP logs in Postgres.

## What you'll learn

- RANGE / LIST / HASH — when to use which
- Partition pruning in EXPLAIN
- Operations: CREATE, ATTACH, DROP partition
- PK/UNIQUE/FK constraints
- Indexes on partitioned tables

## Why partition

| Problem without partitions | With partitions |
|----------------------|--------------|
| DELETE of old data — slow | DROP partition — a metadata op |
| VACUUM over the whole table | Per partition, smaller chunks |
| Index over 400 GB | Index per partition |
| Backup of a single partition | A tablespace per partition is possible |

Don't partition a 100k-row table "for the future" — planner and DDL overhead.

## Declarative partitioning

```sql
CREATE TABLE events (
  id         bigserial,
  created_at timestamptz NOT NULL,
  payload    jsonb
) PARTITION BY RANGE (created_at);

CREATE TABLE events_2026_05 PARTITION OF events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');

CREATE TABLE events_2026_06 PARTITION OF events
  FOR VALUES FROM ('2026-06-01') TO ('2026-07-01');
```

INSERT into the parent — routed by the key. INSERT with no matching partition — an **error**.

## Strategies

| Method | Key | Use case |
|-------|------|----------|
| **RANGE** | date, id range | logs, metrics, orders by month |
| **LIST** | region, tenant_id | multi-region, enum-like |
| **HASH** | hash(id) | even sharding without time |

```sql
-- LIST example
CREATE TABLE orders (...)
PARTITION BY LIST (region);

CREATE TABLE orders_eu PARTITION OF orders FOR VALUES IN ('eu', 'uk');
```

## Partition pruning

```sql
EXPLAIN SELECT count(*) FROM events
WHERE created_at >= '2026-05-10' AND created_at < '2026-05-20';
```

In the plan — **only** `events_2026_05`, not a Seq Scan of all partitions.

Pruning requires:

- a condition on the **partition key** (explicit or inferable);
- `enable_partition_pruning = on` (default).

Without pruning, partitioning is useless for reads.

## Lifecycle management

```sql
-- ahead of time (cron / migration job)
CREATE TABLE events_2026_07 PARTITION OF events
  FOR VALUES FROM ('2026-07-01') TO ('2026-08-01');

-- dropping a month
DROP TABLE events_2025_01;

-- attach an existing table (migration)
CREATE TABLE events_legacy (...) ;
ALTER TABLE events ATTACH PARTITION events_legacy
  FOR VALUES FROM ('2020-01-01') TO ('2021-01-01');
```

The **default partition** catches rows outside the ranges; convenient, but it breaks pruning for the "extra" data.

## Indexes

```sql
CREATE INDEX ON events (created_at);
```

A **partitioned index** is created — a separate B-tree on each partition. `CREATE INDEX CONCURRENTLY` on the parent — PG 14+.

## Constraints

| Constraint | Rule |
|-------------|---------|
| PRIMARY KEY / UNIQUE | Must include **all** partition key columns |
| FOREIGN KEY **to** partitioned | PG 12+ with restrictions |
| FOREIGN KEY **from** partitioned | Harder — often an FK to the parent |
| Global uniqueness without the partition key | Impossible on the parent — redesign |

```sql
-- OK
PRIMARY KEY (created_at, id)

-- NOT OK on RANGE(created_at)
PRIMARY KEY (id)  -- error
```

## Common mistakes

1. Forgot to create the partition for next month — INSERT fails on the 1st.
2. The default partition accepts everything — pruning doesn't work for the "garbage".
3. PK only on `id` — the DDL won't be created.
4. 1000 partitions — planner overhead; use sub-partitioning or a different key.

## Checklist

- [ ] PARTITION BY RANGE — an example for your domain
- [ ] DROP partition vs DELETE of millions of rows
- [ ] Pruning visible in EXPLAIN
- [ ] PK without the partition key — allowed? (no)
- [ ] Cron for CREATE of future partitions

## Next

Lab: [04-lab-partitioning.md](04-lab-partitioning.md).
