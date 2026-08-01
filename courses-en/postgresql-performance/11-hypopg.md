# 11. hypopg — virtual indexes

## Scenario from work

A DBA wants to `CREATE INDEX` on a 200 GB table just "to check the plan". On prod — a `CREATE INDEX CONCURRENTLY` means an hour and lots of I/O; on staging — there's no copy. **hypopg** creates a hypothetical index in the planner's memory: `EXPLAIN` shows an Index Scan **without** building it on disk.

The mock-exams image includes hypopg ([deploy/postgres](../../deploy/postgres/README.md)).

## What you'll learn

- The hypopg_create_index / reset API
- Limitations of hypothetical indexes
- When to create a real index
- Fallback without the extension

## Why hypopg

```sql
CREATE EXTENSION IF NOT EXISTS hypopg;

SELECT * FROM hypopg_create_index(
  'CREATE INDEX ON perf.events (device_id, created_at DESC)'
);
```

A repeated `EXPLAIN` — the planner **sees** the index, but there are no files on disk.

Workflow:

```text
1. EXPLAIN baseline
2. hypopg_create_index(...)
3. EXPLAIN — cost down? Index Scan?
4. hypopg_reset()
5. CREATE INDEX CONCURRENTLY on prod if the gain > threshold
```

## API

```sql
-- create
SELECT indexrelid, indexname FROM hypopg_create_index(
  'CREATE INDEX ON perf.events (device_id) WHERE event_type = ''error'''
);

-- list
SELECT * FROM hypopg_list_index;

-- drop all
SELECT hypopg_reset();
```

Supports B-tree, BRIN, partial, INCLUDE — you pass the full DDL.

## Limitations

| hypopg does | hypopg does NOT |
|---------------|------------------|
| Change the plan in EXPLAIN | Speed up real execution |
| Fast iteration | Account for write amplification on prod |
| Partial/GIN/BRIN | May differ from real build stats |

Always verify with a **real** `EXPLAIN (ANALYZE)` after `CREATE INDEX CONCURRENTLY` on staging.

## Fallback without hypopg

1. `pg_stats` + a selectivity estimate
2. A copy of the table in dev + a real index
3. `CREATE INDEX` on a transactional replica + drop

## pg_hint_plan (last resort)

Forcing a plan hint is **not** a replacement for proper tuning. Use it when the statistics can't be fixed and the deadline is looming. Docs: [pg_hint_plan](https://pghintplan.osdn.jp/).

## Link to developer/ops

- Index in a Flyway migration — [developer/02-flyway](../postgresql-developer/02-flyway.md)
- `CREATE INDEX CONCURRENTLY` in a maintenance window — [ops](../postgresql-ops/README.md)

## Common mistakes

1. hypopg plan is OK → CONCURRENTLY on prod at peak — still I/O.
2. Forgetting `hypopg_reset()` — confusion in later EXPLAINs.
3. Looking only at cost, not ANALYZE after a real index.
4. A hypothetical GIN on 1TB without estimating build time.

## Checklist

- [ ] hypopg doesn't change data on disk
- [ ] hypopg_reset() clears everything
- [ ] When a real CONCURRENTLY
- [ ] The 5-step workflow
- [ ] hypopg limitations vs production

## Next

Lab: [12-lab-hypopg.md](12-lab-hypopg.md).
