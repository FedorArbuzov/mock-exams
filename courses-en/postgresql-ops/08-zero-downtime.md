# 08. Zero-downtime

## Scenario from work

Product: "add a `status` column to orders without downtime." DBA: `ALTER ADD COLUMN` — milliseconds. But `DROP COLUMN` of the old field breaks the old deploy. Solution: **expand/contract** across three releases. Another case: an index on 500M rows — `CREATE INDEX` blocks writes; **`CONCURRENTLY`** doesn't.

Zero-downtime is a discipline of migrations + replication cutover, not Postgres magic.

## What you'll learn

- Expand/contract for schema
- Logical replication cutover
- `pg_rewind` after promote
- When CONCURRENTLY is enough

## Expand / contract (schema)

```text
Phase 1 EXPAND:
  ADD COLUMN status text NULL;
  Deploy app v2: writes status, reads COALESCE(status, legacy)

Phase 2 BACKFILL:
  UPDATE orders SET status = 'pending' WHERE status IS NULL;
  (batch job, no lock storm)

Phase 3 CONTRACT:
  Deploy app v3: only new column
  ALTER DROP old column;  -- after 100% on new code
```

| Operation | Zero-downtime? |
|----------|----------------|
| `ADD COLUMN NULL` | Yes (PG 11+ fast) |
| `ADD COLUMN DEFAULT` | PG 11+ — no table rewrite |
| `DROP COLUMN` | Blocks while the app uses it |
| `RENAME COLUMN` | Needs expand (add + copy + drop) |
| `CREATE INDEX` | **No** — use `CONCURRENTLY` |
| `ALTER TYPE` | Often a rewrite — plan for it |

Feature flags coordinate app v1/v2 ([developer migrations](../postgresql-developer/README.md)).

## Logical replication cutover

For a major upgrade / cluster move:

```text
1. Publication on old, subscription on new
2. Catch-up lag → 0
3. Short read-only on old (seconds–minutes)
4. Drop subscription, redirect apps
5. Keep old read-only for rollback window
```

DDL on old does **not** flow through — mirror it manually or with a migration tool.

## pg_rewind

After a failover, the old primary can **rejoin** as a replica without a full `pg_basebackup`:

```bash
pg_rewind --target-pgdata=/var/lib/postgresql/data \
  --source-server='host=new_primary ...'
```

Requires: `wal_log_hints` or data checksums, and compatible timelines. Patroni does this automatically.

## Major upgrade paths (summary)

| Method | Cutover downtime | Complexity |
|-------|------------------|-----------|
| `pg_upgrade --link` | Minutes | Medium |
| Blue/green + logical | Seconds–minutes RO | High |
| pg_dump/restore | Hours | Low |

## CREATE INDEX CONCURRENTLY

```sql
CREATE INDEX CONCURRENTLY orders_status_idx ON shop.orders (status);
```

Doesn't block writes; takes longer; may fail — check `pg_index.indisvalid`.

## Common mistakes

1. DROP COLUMN in the same release as ADD — old pods crash.
2. Backfill without batching — long locks.
3. Logical cutover without sequence sync.
4. `CREATE INDEX` without CONCURRENTLY on prod.

## Checklist

- [ ] Why DROP COLUMN is not zero-downtime
- [ ] Feature flags in expand/contract
- [ ] CREATE INDEX CONCURRENTLY
- [ ] pg_rewind — why
- [ ] Logical cutover RO window

## Next

Lab: [09-lab-cutover.md](09-lab-cutover.md).
