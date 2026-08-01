# 09. Lab: cutover (simulation)

## Why this lab

A full blue/green cluster is expensive locally. Simulating **two schemas** blue/green in one database teaches the freeze → final sync → switch → rollback mindset of a cutover without a second Postgres.

## Prerequisites

- The Postgres environment, role `course`

## Task 1. Two schemas

```sql
CREATE SCHEMA IF NOT EXISTS blue;
CREATE SCHEMA IF NOT EXISTS green;

DROP TABLE IF EXISTS green.orders;
DROP TABLE IF EXISTS blue.orders;

CREATE TABLE blue.orders (
  id     serial PRIMARY KEY,
  amount numeric(10,2) NOT NULL,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE green.orders (LIKE blue.orders INCLUDING ALL);

INSERT INTO blue.orders (amount) VALUES (10), (20), (30);
```

## Task 2. "Replication" and drift

```sql
-- initial sync
INSERT INTO green.orders SELECT * FROM blue.orders;

-- new writes only in blue (simulating prod)
INSERT INTO blue.orders (amount) VALUES (40);
UPDATE blue.orders SET amount = 15 WHERE id = 1;
```

## Task 3. Cutover window

Document and run:

```sql
-- Step 1: freeze writes (in reality — app maintenance)
-- Step 2: final sync
INSERT INTO green.orders (id, amount, updated_at)
SELECT b.id, b.amount, b.updated_at
FROM blue.orders b
WHERE NOT EXISTS (SELECT 1 FROM green.orders g WHERE g.id = b.id);

UPDATE green.orders g
SET amount = b.amount, updated_at = b.updated_at
FROM blue.orders b
WHERE g.id = b.id AND (g.amount IS DISTINCT FROM b.amount);

-- Step 3: verify counts
SELECT 'blue' AS side, count(*) FROM blue.orders
UNION ALL
SELECT 'green', count(*) FROM green.orders;

-- Step 4: app "switches" to green.orders
```

## Task 4. Runbook

`cutover-runbook.md` with ≥ 8 steps:

1. Announce maintenance
2. Enable read-only on blue (app)
3. Wait for in-flight transactions
4. Final sync SQL
5. Verify row counts / checksum sample
6. Switch connection string to green
7. Smoke tests
8. Rollback path if smoke fails

## Task 5. Rollback

Describe: the smoke test failed — how to return the app to `blue.orders` in < 5 minutes.

## Task 6. Read-only window

Estimate in seconds how long your cutover took (sync only). In prod, add DNS TTL and pool drain.

## Success criteria

- [ ] blue/green counts match after sync
- [ ] Runbook ≥ 8 steps
- [ ] Rollback documented
- [ ] You understand the difference from real logical replication

## Next

On-call: [10-oncall-runbooks.md](10-oncall-runbooks.md).
