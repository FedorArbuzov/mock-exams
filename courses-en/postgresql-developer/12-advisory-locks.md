# 12. Advisory locks and queues

## Scenario

Three worker pods process `pending` orders. Without coordination two workers pick the same order — double shipment to the warehouse. `SELECT ... FOR UPDATE` without `SKIP LOCKED` — the second worker **waits** on the lock, throughput drops. Solution: a **queue with `FOR UPDATE SKIP LOCKED`** + advisory lock for a nightly cron «only one instance».

A native Postgres pattern — no Redis for simple job queues.

**Related:** [05-lab-liquibase](05-lab-liquibase.md) (`devapp_lb.tasks`), [python-async](../python-async/README.md).

## What you'll learn

- Session vs transaction advisory locks
- `pg_try_advisory_lock`
- Queue with `FOR UPDATE SKIP LOCKED`
- Advisory vs row locks

## Advisory locks

A logical lock by a **numeric key** — not tied to a table.

```sql
-- session level — until disconnect or unlock
SELECT pg_advisory_lock(42);
SELECT pg_try_advisory_lock(42);  -- false if held, does not wait
SELECT pg_advisory_unlock(42);

-- transaction level — until COMMIT
SELECT pg_advisory_xact_lock(42);

-- two int32 keys
SELECT pg_advisory_lock(1, 100);

-- hash a string
SELECT pg_advisory_xact_lock(hashtext('nightly-report'));
```

| Function | Locking |
|---------|------------|
| `pg_advisory_lock` | Session, waits |
| `pg_try_advisory_lock` | Session, does not wait |
| `pg_advisory_xact_lock` | Transaction |
| `pg_advisory_unlock` | Session lock only |

### When advisory

| Use case | Example |
|----------|--------|
| Cron singleton | Only one pod for nightly ETL |
| Migration guard | Flyway + advisory in a custom runner |
| App-level mutex | `hashtext('import-' || tenant_id)` |

**Session lock risk:** forgot `unlock` — held until disconnect. Prefer **xact lock**.

## Queue with SKIP LOCKED

```sql
BEGIN;

SELECT id, payload
FROM devapp_lb.tasks
WHERE status = 'pending'
ORDER BY id
FOR UPDATE SKIP LOCKED
LIMIT 1;

-- worker got id=7
UPDATE devapp_lb.tasks SET status = 'processing' WHERE id = 7;

COMMIT;
```

```text
Worker A: FOR UPDATE → lock row 1
Worker B: SKIP LOCKED → skip row 1, lock row 2
Worker C: SKIP LOCKED → lock row 3
```

Without `SKIP LOCKED` Worker B is **blocked** on row 1.

## Full worker pattern

```sql
BEGIN;
WITH picked AS (
  SELECT id FROM devapp_lb.tasks
  WHERE status = 'pending'
  ORDER BY created_at NULLS LAST, id
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE devapp_lb.tasks t
SET status = 'processing', started_at = now()
FROM picked
WHERE t.id = picked.id
RETURNING t.id, t.payload;
COMMIT;
```

After processing:

```sql
UPDATE devapp_lb.tasks SET status = 'done', finished_at = now() WHERE id = $1;
```

Failed jobs — `status = 'failed'` + retry policy.

## Advisory vs row lock

| | Advisory | FOR UPDATE row |
|---|----------|----------------|
| Object | int key | specific row |
| Visibility in pg_locks | advisory | transactionid + tuple |
| Deadlock on rows | no | possible |
| Task queue | not enough alone | SKIP LOCKED ✅ |
| Singleton cron | ✅ | overkill |

## vs Redis / SQS

| | Postgres queue | Redis/SQS |
|---|----------------|-----------|
| Extra infra | No | Yes |
| Throughput | Moderate | High |
| ACID with order | ✅ same TX | Outbox pattern |
| Visibility timeout | DIY | Built-in |

For a shop MVP — a Postgres queue is often enough.

## Common mistakes

1. `FOR UPDATE` without SKIP LOCKED — workers serialize.
2. SELECT outside a transaction — race between SELECT and UPDATE.
3. Session advisory lock without unlock in finally.
4. No index on `(status, id)` — slow dequeue.
5. Long processing inside the TX — holds the row lock.

## Checklist

- [ ] xact lock vs session lock
- [ ] SKIP LOCKED for workers
- [ ] UPDATE in the same transaction
- [ ] Index on status for dequeue
- [ ] Advisory for cron singleton

## Next

Lab: [13-lab-advisory-locks.md](13-lab-advisory-locks.md).
