# 05. PostgreSQL extensions

## Real-world scenario

"Why doesn't `LIKE '%widget%'` use an index?" — Seq Scan over 10M products. `pg_trgm` + GIN solves fuzzy search. "How bloated is the table?" — `n_dead_tup` lies; `pgstattuple` shows dead pages. "A report from another cluster" — `postgres_fdw` without ETL in Python.

Extensions are a way to add functionality **inside** Postgres. On managed RDS not all are available; on the mock-exams stand the image already includes some ([deploy/postgres](../../deploy/postgres/README.md)).

## What you'll learn

- How to install extensions and where they live
- pg_stat_statements — advanced usage
- pg_trgm, pgstattuple, postgres_fdw
- pg_repack, pg_cron — ops tools

## Installation

```sql
SELECT name, default_version, installed_version, comment
FROM pg_available_extensions
ORDER BY name;

CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA public;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

| Question | Answer |
|--------|-------|
| Where is it installed? | In the **current database**; objects go into a schema (often `public` or `extensions`) |
| Superuser? | Often needed for CREATE; on RDS — `rds_superuser` + allowlist |
| PG upgrade | `ALTER EXTENSION name UPDATE` after a major upgrade |

## pg_stat_statements

Already in [intermediate/14-lab-monitoring](../postgresql-intermediate/14-lab-monitoring.md). Advanced level:

```sql
SELECT queryid, calls, mean_exec_time, stddev_exec_time,
       rows, shared_blks_hit, shared_blks_read
FROM pg_stat_statements
WHERE queryid = 123456789;
```

Practices:

- `pg_stat_statements_reset()` after a deploy — "before/after" comparison.
- `pg_stat_statements.save` — persist across restart (PG 14+).
- Normalization hides literals — good for aggregates, bad for ad-hoc debug.

Related: [postgresql-performance](../postgresql-performance/README.md).

## pg_trgm — substring search

```sql
CREATE EXTENSION pg_trgm;

CREATE INDEX products_name_trgm_idx ON shop.products
  USING gin (name gin_trgm_ops);

EXPLAIN ANALYZE
SELECT * FROM shop.products WHERE name ILIKE '%widget%';
```

| Approach | Plan |
|--------|------|
| `LIKE '%x%'` without trgm | Seq Scan |
| `LIKE 'prefix%'` | B-tree |
| `ILIKE '%x%'` + GIN trgm | Bitmap Index Scan on GIN |

Trade-off: the GIN index is large, INSERT is slower.

Also: `similarity()`, the `%` operator for fuzzy dedup.

## pgstattuple — precise bloat

```sql
CREATE EXTENSION pgstattuple;

SELECT * FROM pgstattuple('shop.orders');
-- tuple_percent, dead_tuple_percent, free_space ...
```

vs `n_dead_tup` from `pg_stat_user_tables` ([intermediate/11-vacuum-bloat](../postgresql-intermediate/11-vacuum-bloat.md)):

| | pg_stat | pgstattuple |
|---|---------|-------------|
| Cost | Cheap | Reads the table — heavy on large ones |
| Accuracy | Stats estimate | Heap pages |
| When | Monitoring | One-off bloat analysis |

## postgres_fdw — remote tables

```sql
CREATE EXTENSION postgres_fdw;

CREATE SERVER warehouse FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'warehouse.db', port '5432', dbname 'analytics');

CREATE USER MAPPING FOR course SERVER warehouse
  OPTIONS (user 'reader', password 'secret');

CREATE FOREIGN TABLE remote_orders (
  id bigint, created_at timestamptz, total numeric
) SERVER warehouse OPTIONS (schema_name 'shop', table_name 'orders');

SELECT count(*) FROM remote_orders WHERE created_at > now() - interval '1 day';
```

Use cases: federation, gradual migration, reads from a legacy DB.  
Cons: latency, pushdown depends on the optimizer, no remote join statistics.

## pg_repack / pg_cron

| Extension | Purpose |
|-----------|------------|
| **pg_repack** | Online rebuild of table/index without a VACUUM FULL lock |
| **pg_cron** | `SELECT cron.schedule('0 3 * * *', $$VACUUM ANALYZE shop.orders$$)` |

On RDS — check the allowlist. In K8s — an image with extensions ([14-lab-cloudnativepg](14-lab-cloudnativepg.md)).

## Common mistakes

1. `CREATE EXTENSION` in template1 "so it's everywhere" — better to do it explicitly per database + migration.
2. pg_trgm on every text column — index bloat.
3. pgstattuple on 500 GB at peak — an I/O storm.
4. FDW join of large tables without `use_remote_estimate` / statistics.

## Checklist

- [ ] An EXTENSION is bound to a database
- [ ] pg_trgm vs Seq Scan on `%...%`
- [ ] An FDW use case (one example)
- [ ] pgstattuple vs n_dead_tup
- [ ] Reset pg_stat_statements after a deploy

## Next

Lab: [06-lab-extensions.md](06-lab-extensions.md).
