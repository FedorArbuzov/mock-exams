# 12. Lab: Transaction Visibility

MVCC is easy to read and forget. Two `psql` sessions make it obvious: uncommitted changes, Read Committed vs Repeatable Read behavior, dead tuple growth, `idle in transaction`, and `FOR UPDATE` waiting.

## What you need

- `shop` schema with `products` and `orders` ([04-lab-ddl](04-lab-ddl.md))
- two terminals connected to `course`

```bash
psql "postgresql://course:course@localhost:5432/course"
```

Label sessions as **A** and **B**.

## Task 1. Uncommitted update is invisible

Session A:

```sql
BEGIN;
UPDATE shop.products SET price = price + 1 WHERE id = 1;
SELECT price FROM shop.products WHERE id = 1;
-- keep open
```

Session B:

```sql
SELECT price FROM shop.products WHERE id = 1;
```

B should still see old value.

Now commit in A:

```sql
COMMIT;
```

B reads new value after commit.

## Task 2. Read Committed snapshot changes per statement

Session A:

```sql
BEGIN;
SELECT count(*) FROM shop.orders;
```

Session B:

```sql
INSERT INTO shop.orders (product_id, qty) VALUES (1, 1);
COMMIT;
```

Session A (same transaction):

```sql
SELECT count(*) FROM shop.orders;
COMMIT;
```

Count should increase (new snapshot per statement).

## Task 3. Repeatable Read snapshot is transaction-wide

Reset sample value:

```sql
UPDATE shop.products SET price = 100 WHERE id = 1;
```

Session B:

```sql
BEGIN ISOLATION LEVEL REPEATABLE READ;
SELECT price FROM shop.products WHERE id = 1;
```

Session A:

```sql
BEGIN;
UPDATE shop.products SET price = price + 50 WHERE id = 1;
COMMIT;
```

Session B (same RR transaction):

```sql
SELECT price FROM shop.products WHERE id = 1;
COMMIT;
```

B still sees old snapshot until commit/new transaction.

## Task 4. Atomicity (all-or-nothing)

```sql
CREATE TABLE IF NOT EXISTS shop.accounts (
  id      int PRIMARY KEY,
  balance numeric(10,2) NOT NULL CHECK (balance >= 0)
);

INSERT INTO shop.accounts (id, balance) VALUES (1, 1000), (2, 500)
ON CONFLICT (id) DO NOTHING;
```

Successful transfer:

```sql
BEGIN;
UPDATE shop.accounts SET balance = balance - 100 WHERE id = 1;
UPDATE shop.accounts SET balance = balance + 100 WHERE id = 2;
COMMIT;
```

Rollback scenario:

```sql
BEGIN;
UPDATE shop.accounts SET balance = balance - 900 WHERE id = 1;
UPDATE shop.accounts SET balance = balance - 900 WHERE id = 2; -- fails CHECK
ROLLBACK;
```

Verify balances are unchanged from pre-failure state.

## Task 5. Dead tuples after updates

```sql
SELECT n_live_tup, n_dead_tup
FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'products';

DO $$
BEGIN
  FOR i IN 1..100 LOOP
    UPDATE shop.products SET price = price + 0.01 WHERE id = 1;
  END LOOP;
END $$;

SELECT n_live_tup, n_dead_tup
FROM pg_stat_user_tables
WHERE schemaname = 'shop' AND relname = 'products';
```

Then cleanup:

```sql
VACUUM shop.products;
```

`n_dead_tup` should drop.

## Task 6. idle in transaction vs VACUUM

Session A:

```sql
BEGIN;
SELECT price FROM shop.products WHERE id = 1;
-- keep open
```

Session B creates churn and runs vacuum:

```sql
UPDATE shop.products SET price = price + 0.01 WHERE id = 1;
VACUUM shop.products;
```

With A open, cleanup may stay limited due to snapshot visibility constraints.

Find idle session:

```sql
SELECT pid, usename, state, xact_start, left(query, 50)
FROM pg_stat_activity
WHERE datname = 'course' AND state = 'idle in transaction';
```

## Task 7. `FOR UPDATE` lock waiting

Session A:

```sql
BEGIN;
SELECT * FROM shop.products WHERE id = 1 FOR UPDATE;
```

Session B:

```sql
BEGIN;
UPDATE shop.products SET price = 0 WHERE id = 1;
```

B waits until A commits/rolls back.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| B sees new value immediately | A already committed |
| count does not change in task 2 | session A may be RR or reopened incorrectly |
| no idle sessions visible | A ended transaction |
| no wait in task 7 | wrong row or missing `FOR UPDATE` |

## You're done when

- [ ] B cannot see uncommitted A changes
- [ ] Read Committed count changed within same transaction
- [ ] Repeatable Read snapshot stayed stable
- [ ] Rollback restored atomic behavior
- [ ] `n_dead_tup` increased then decreased after vacuum
- [ ] idle-in-transaction behavior observed
- [ ] `FOR UPDATE` wait confirmed

## What's next

Logical backups: [13-backup-pgdump.md](13-backup-pgdump.md).
