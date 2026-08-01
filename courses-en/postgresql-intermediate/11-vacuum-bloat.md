# 11. VACUUM, bloat, autovacuum

## Real-world scenario

The `events` table is 200 GB, `SELECT count(*)` shows 5 million rows. The DBA is shocked: bloat after mass UPDATEs. Autovacuum "is working," but can't keep up — three BI sessions have been `idle in transaction` since morning ([basic/11-transactions-mvcc](../postgresql-basic/11-transactions-mvcc.md)). Another case: `VACUUM FULL` during a peak — the site went down for 40 minutes under an exclusive lock.

Vacuum isn't "optimization for perfectionists," it's **mandatory** Postgres hygiene.

## What you'll learn

- Bloat and dead tuples
- `VACUUM` vs `VACUUM FULL` vs `VACUUM ANALYZE`
- How autovacuum chooses tables
- Per-table tuning for hot tables
- Freeze and transaction ID wraparound

## Bloat

UPDATE/DELETE leave **dead tuples** ([basic/11](../postgresql-basic/11-transactions-mvcc.md)). They take up space in the table and indexes; a Seq Scan walks over them.

```sql
SELECT schemaname, relname,
       n_live_tup, n_dead_tup,
       round(n_dead_tup::numeric / nullif(n_live_tup + n_dead_tup, 0), 3) AS dead_ratio,
       last_autovacuum, last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'shop'
ORDER BY n_dead_tup DESC;
```

| dead_ratio | Action |
|------------|----------|
| < 0.05 | Normal on OLTP |
| 0.1–0.2 | Watch |
| > 0.2 | Manual VACUUM, autovacuum tuning, look for long transactions |

Exact bloat — the `pgstattuple` extension; in ops — monitoring size vs live tuples.

## VACUUM

```sql
VACUUM (VERBOSE) shop.orders;
VACUUM (ANALYZE, VERBOSE) shop.orders;
```

| | Regular VACUUM | VACUUM FULL |
|---|----------------|-------------|
| Locks | Brief, doesn't block DML for long | **ACCESS EXCLUSIVE** — the table is unavailable |
| Disk space | Marks pages reusable | Returns it to the OS (rewrites the file) |
| When | Constantly / autovacuum | Rarely, in a maintenance window |

`VACUUM FULL` on a production orders table at peak is an anti-pattern. Alternative: `pg_repack` (extension), partition swap.

## Autovacuum

Launcher + workers. Threshold for a table:

```text
vacuum threshold = autovacuum_vacuum_threshold +
                   autovacuum_vacuum_scale_factor * reltuples
```

Defaults: threshold 50, scale_factor 0.2 → on 1M rows, vacuum after ~200k dead tuples.

Globally:

```sql
SHOW autovacuum;
SHOW autovacuum_max_workers;
SHOW autovacuum_naptime;
```

**Why it can't keep up:**

- long `idle in transaction`;
- mass UPDATE of one table faster than the workers;
- `autovacuum_vacuum_cost_delay` too conservative on SSD;
- anti-wraparound vacuum competing for workers.

## Per-table tuning

Hot table `shop.orders`:

```sql
ALTER TABLE shop.orders SET (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.01,
  autovacuum_vacuum_cost_delay = 2
);
```

More frequent vacuum/analyze at a smaller percentage of dead rows.

## Freeze and wraparound

Every transaction has an **XID** (32-bit). Old row versions must be **frozen**, otherwise — a catastrophic emergency vacuum.

```sql
SELECT datname, age(datfrozenxid) AS freeze_age
FROM pg_database
ORDER BY freeze_age DESC;
```

`autovacuum_freeze_max_age` — the threshold for a forced anti-wraparound. A symptom of being close to the limit — warnings in the logs, aggressive autovacuum.

## pg_repack (preview)

Online rebuild of a table without a VACUUM FULL lock — if the extension is installed ([ops](../postgresql-ops/README.md)). Not in the base environment by default.

## Common mistakes

1. Disabling autovacuum "for the night for speed" globally.
2. `VACUUM FULL` as the first reaction to bloat.
3. Ignoring `idle in transaction` in monitoring.
4. Not running `ANALYZE` after a bulk load — bad plans ([performance](../postgresql-performance/README.md)).

## Checklist

- [ ] VACUUM vs VACUUM FULL
- [ ] Why autovacuum can't keep up (3 reasons)
- [ ] dead_ratio > 0.2 — what to do
- [ ] wraparound — the symptom and `age(datfrozenxid)`
- [ ] `VACUUM ANALYZE` after a manual cleanup

## Next

Lab: [12-lab-vacuum.md](12-lab-vacuum.md).
