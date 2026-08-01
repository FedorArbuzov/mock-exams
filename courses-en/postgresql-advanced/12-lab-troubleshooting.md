# 12. Lab: incident analysis

## Why this lab

Reproducing blocking and a deadlock in two `psql` sessions + an incident report — an on-call skill. The postmortem template will be useful in [15-final-project](15-final-project.md).

## Prerequisites

- The `shop` schema
- Two `psql` terminals as `course`

## Scenario A: DDL blocked by an idle transaction

### Session 1

```sql
BEGIN;
SELECT * FROM shop.products WHERE id = 1 FOR UPDATE;
-- or just BEGIN; SELECT 1;
-- do NOT COMMIT — simulating idle in transaction
```

Check:

```sql
SELECT pid, state FROM pg_stat_activity WHERE pid = pg_backend_pid();
```

### Session 2

```sql
ALTER TABLE shop.products ADD COLUMN promo text;
```

It should **hang** (waiting for the lock).

### Session 3 (a third one, or Session 2 in another window)

The query from [11-troubleshooting](11-troubleshooting.md) — blocked/blocking.

Record `blocked_pid`, `blocking_pid`, `blocking_state`.

### Resolution

**Session 1:** `ROLLBACK;`

**Session 2:** the ALTER should complete.

### Prevention (written)

- `idle_in_transaction_session_timeout`
- `lock_timeout` on migrations
- Don't run DDL at peak

## Scenario B: deadlock

**Session 1:**

```sql
BEGIN;
UPDATE shop.orders SET qty = qty + 1 WHERE id = 1;
```

**Session 2:**

```sql
BEGIN;
UPDATE shop.orders SET qty = qty + 1 WHERE id = 2;
UPDATE shop.orders SET qty = qty + 1 WHERE id = 1;  -- waits for session 1
```

**Session 1:**

```sql
UPDATE shop.orders SET qty = qty + 1 WHERE id = 2;  -- deadlock
```

**Expected:** one session gets `deadlock detected`, the other COMMITs successfully.

Enable in the logs (if not already):

```sql
ALTER SYSTEM SET log_lock_waits = on;
ALTER SYSTEM SET deadlock_timeout = '1s';
SELECT pg_reload_conf();
```

`docker logs mock-postgres | grep -i deadlock`

## Deliverable: incident report

Create `docs/incident-2026-blocking.md`:

```markdown
# Incident: Migration blocked by idle transaction

## Timeline (UTC)
- 14:00 — deploy migration promo column
- 14:05 — API p99 > 30s
- 14:12 — on-call identified blocking_pid

## Impact
- Duration, affected services

## Root cause
- BI script idle in transaction since 09:00

## Resolution
- pg_terminate_backend(...) / ROLLBACK

## Prevention
- idle_in_transaction_session_timeout = 5min
- lock_timeout on migration role
- CI migration window

## Lessons learned
```

Fill it in with the real PIDs and times from the lab.

## Scenario C (optional): pg_cancel_backend

On a hung SELECT (not idle):

```sql
SELECT pg_cancel_backend(<blocked_pid>);
```

Compare with terminate.

## Success criteria

- [ ] Reproduced blocking ALTER + open txn
- [ ] Found blocking_pid with a SQL query
- [ ] Deadlock caught or expected behavior described
- [ ] Incident doc ≥ 6 sections filled in

## Next

Cloud/K8s: [13-cloud-k8s.md](13-cloud-k8s.md).
