# 13. Lab: worker + SKIP LOCKED

## Why this lab

Two psql «workers» claim different tasks without blocking — the order fulfillment queue pattern in a shop.

## Prerequisites

- [05-lab-liquibase](05-lab-liquibase.md) — `devapp_lb.tasks`
- [12-advisory-locks](12-advisory-locks.md)

## Task 1. Prepare tasks

```sql
TRUNCATE devapp_lb.tasks RESTART IDENTITY;

INSERT INTO devapp_lb.tasks (payload, status) VALUES
  ('{"job": 1, "order_id": 101}', 'pending'),
  ('{"job": 2, "order_id": 102}', 'pending'),
  ('{"job": 3, "order_id": 103}', 'pending');
```

## Task 2. Worker A (session 1)

```sql
BEGIN;

SELECT id, payload FROM devapp_lb.tasks
WHERE status = 'pending'
ORDER BY id
FOR UPDATE SKIP LOCKED
LIMIT 1;
-- remember the id, e.g. 1

UPDATE devapp_lb.tasks SET status = 'done' WHERE id = 1;

COMMIT;
```

**Do not commit** right away — leave the TX open for task 3 (or use two terminals).

## Task 3. Worker B (session 2)

While A is in a transaction (or after A commits):

```sql
BEGIN;

SELECT id, payload FROM devapp_lb.tasks
WHERE status = 'pending'
ORDER BY id
FOR UPDATE SKIP LOCKED
LIMIT 1;

COMMIT;
```

Expected: Worker B gets **id=2** (not 1), without waiting on the lock for row 1 if A still holds it — SKIP LOCKED skips it.

Record:

| Worker | id claimed |
|--------|---------|
| A | |
| B | |

## Task 4. Without SKIP LOCKED (comparison)

Tabletop: Worker A holds `FOR UPDATE` on row 1. Worker B with `FOR UPDATE` without SKIP — **blocked**. Explain in one sentence why SKIP LOCKED.

## Task 5. Advisory lock for cron

```sql
BEGIN;
SELECT pg_try_advisory_xact_lock(hashtext('nightly-report'));
-- true = this worker runs the report
-- false = another pod already started
COMMIT;
```

In a second session at the same time:

```sql
SELECT pg_try_advisory_xact_lock(hashtext('nightly-report'));
```

Expected: one true, one false (in different TXs).

## Task 6. Index (optional)

```sql
CREATE INDEX IF NOT EXISTS tasks_pending_idx
  ON devapp_lb.tasks (id) WHERE status = 'pending';

EXPLAIN SELECT id FROM devapp_lb.tasks
WHERE status = 'pending' FOR UPDATE SKIP LOCKED LIMIT 1;
```

## Troubleshooting

| Problem | Fix |
|----------|-----|
| Both claimed id=1 | SELECT outside TX or without SKIP |
| tasks not exist | liquibase update |
| try_advisory both true | different keys or after COMMIT |

## Success criteria

- [ ] Two workers — different ids
- [ ] SKIP LOCKED explained
- [ ] Advisory try lock demonstrated
- [ ] UPDATE status in the same TX

## Next

CI: [14-ci-migrations.md](14-ci-migrations.md).
