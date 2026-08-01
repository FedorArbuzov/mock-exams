# 11. Troubleshooting: locks and deadlocks

## Real-world scenario

14:00 — deploy of the migration `ALTER TABLE orders ADD COLUMN ...`. 14:05 — API timeout. `pg_stat_activity`: the migration is waiting for `AccessExclusiveLock`, blocked by a transaction that's `idle in transaction` from a morning script. 14:20 — a deadlock between two Celery workers updating orders in different order.

Advanced troubleshooting — a systematic analysis of **locks**, **deadlocks**, **disk**, **connections**.

## What you'll learn

- The blocked/blocking query
- Lock modes and DDL conflicts
- Deadlock detection
- cancel vs terminate
- Disk full and connection storm

Related: [intermediate/13-monitoring](../postgresql-intermediate/13-monitoring.md), [ops runbooks](../postgresql-ops/10-oncall-runbooks.md).

## Who is blocking whom

```sql
SELECT blocked.pid AS blocked_pid,
       left(blocked.query, 60) AS blocked_query,
       blocking.pid AS blocking_pid,
       left(blocking.query, 60) AS blocking_query,
       blocking.state AS blocking_state,
       now() - blocking.xact_start AS blocking_xact_age
FROM pg_stat_activity blocked
JOIN pg_locks bl ON bl.pid = blocked.pid AND NOT bl.granted
JOIN pg_locks blks ON bl.locktype = blks.locktype
  AND bl.database IS NOT DISTINCT FROM blks.database
  AND bl.relation IS NOT DISTINCT FROM blks.relation
  AND bl.page IS NOT DISTINCT FROM blks.page
  AND bl.tuple IS NOT DISTINCT FROM blks.tuple
  AND bl.virtualxid IS NOT DISTINCT FROM blks.virtualxid
  AND bl.transactionid IS NOT DISTINCT FROM blks.transactionid
  AND bl.classid IS NOT DISTINCT FROM blks.classid
  AND bl.objid IS NOT DISTINCT FROM blks.objid
  AND bl.objsubid IS NOT DISTINCT FROM blks.objsubid
  AND bl.pid <> blks.pid
JOIN pg_stat_activity blocking ON blocking.pid = blks.pid;
```

Additionally:

```sql
SELECT locktype, relation::regclass, mode, granted, pid
FROM pg_locks
WHERE NOT granted OR relation IS NOT NULL
ORDER BY pid;
```

## Lock modes (simplified)

| Mode | Typical operation | Blocks |
|------|-------------------|-----------|
| `AccessShareLock` | SELECT | AccessExclusive |
| `RowExclusiveLock` | INSERT/UPDATE/DELETE | Exclusive, AccessExclusive |
| `ShareLock` | CREATE INDEX (non concurrent) | RowExclusive, Write |
| `AccessExclusiveLock` | ALTER, DROP, VACUUM FULL, TRUNCATE | **Everything** |

**idle in transaction** + an open SELECT holds an `AccessShareLock` — **ALTER TABLE** waits for AccessExclusive → a queue of all writers.

Prevention:

```sql
ALTER SYSTEM SET idle_in_transaction_session_timeout = '5min';
SELECT pg_reload_conf();
```

## Deadlock

Postgres **detects** a deadlock and aborts **one** transaction:

```text
ERROR:  deadlock detected
DETAIL: Process 12345 waits for ShareLock on transaction 67890; blocked by process 54321...
```

```ini
deadlock_timeout = 1s
log_lock_waits = on
```

Typical pattern: Tx1: lock row A → row B; Tx2: lock B → A.

The fix in the app: a **single order** of updating rows (sort by id); short transactions.

## cancel vs terminate

```sql
SELECT pg_cancel_backend(pid);      -- SIGINT — cancel the current query
SELECT pg_terminate_backend(pid);   -- SIGTERM — tear down the session
```

| | cancel | terminate |
|---|--------|-----------|
| idle in transaction | won't help | yes |
| active long query | yes | yes |
| replication sender | be careful | may break the replica |

First identify the `application_name`, then coordinate with the session owner.

## Disk full

Symptoms: INSERT fails, DB in recovery, archive fails.

Order of checks:

```bash
df -h $PGDATA
du -sh $PGDATA/pg_wal
```

| Cause | Action |
|---------|----------|
| WAL not archived | Fix archive_command; [intermediate/03-wal](../postgresql-intermediate/03-wal.md) |
| Replication slot | Drop the stale slot / fix the consumer |
| Temp files | `log_temp_files`; heavy sorts |
| Log files | Rotation |

## Connection storm

```text
FATAL: sorry, too many clients already
```

1. `pg_stat_activity` count by `application_name`
2. PgBouncer ([intermediate/15](../postgresql-intermediate/15-pgbouncer.md))
3. `max_connections` — the last lever, not the first

## Common mistakes

1. `terminate` of replication without a failover plan.
2. A DDL migration at peak without `lock_timeout`.
3. Ignoring `blocking_state = idle in transaction`.
4. Killing a random backend — losing data of an uncommitted txn.

## Checklist

- [ ] cancel vs terminate
- [ ] idle in transaction + ALTER — what happens (a block)
- [ ] Deadlock — which one does Postgres abort (one txn)
- [ ] Disk full — first check pg_wal
- [ ] The blocked/blocking query saved in the runbook

## Next

Lab: [12-lab-troubleshooting.md](12-lab-troubleshooting.md).
