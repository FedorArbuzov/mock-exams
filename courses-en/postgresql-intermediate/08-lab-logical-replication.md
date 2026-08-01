# 08. Lab: logical publication

## Why this lab

Setting up publication/subscription once in the docs is easy; in practice people confuse the **subscriber database**, forget `wal_level=logical` and the table structure. This lab on a single cluster with the `course_sub` database is a minimal working pipeline.

## Prerequisites

- Primary on 5432, the `shop` schema, the `products` table.
- Readiness for a **restart** for `wal_level = logical`.

## Task 1. wal_level logical

```sql
SHOW wal_level;
```

If it's not `logical`:

```sql
ALTER SYSTEM SET wal_level = 'logical';
```

Restart:

```bash
docker compose -f deploy/postgres/docker-compose.yml restart postgres
```

Verification:

```sql
SHOW wal_level;
```

## Task 2. Publication on the primary (course)

```sql
DROP PUBLICATION IF EXISTS lab_pub;
CREATE PUBLICATION lab_pub FOR TABLE shop.products;
```

```sql
SELECT pubname, schemaname, tablename FROM pg_publication_tables;
```

## Task 3. The subscriber database

```sql
CREATE DATABASE course_sub;
```

Connect to `course_sub`:

```bash
psql "postgresql://course:course@localhost:5432/course_sub"
```

Create the structure (the same as on the primary):

```sql
CREATE SCHEMA shop;

CREATE TABLE shop.products (
  id    serial PRIMARY KEY,
  sku   text NOT NULL UNIQUE,
  name  text NOT NULL,
  price numeric(10,2) NOT NULL CHECK (price >= 0)
);
```

**Important:** column names and types must match the publisher.

## Task 4. Subscription

In `course_sub`:

```sql
CREATE SUBSCRIPTION lab_sub
  CONNECTION 'host=localhost port=5432 dbname=course user=course password=course'
  PUBLICATION lab_pub
  WITH (copy_data = true);
```

Check the status (in `course` or `course_sub`):

```sql
SELECT subname, pid, received_lsn IS NOT NULL AS receiving
FROM pg_stat_subscription;
```

On the primary — the slot:

```sql
\c course
SELECT slot_name, slot_type, active FROM pg_replication_slots;
```

**Expected:** `lab_sub` or the slot name, `active = true`, the initial copy finished.

## Task 5. Replicating an INSERT

On the **primary** (`course`):

```sql
INSERT INTO shop.products (sku, name, price)
VALUES ('Z9', 'Logical New', 1.00);
```

On the **subscriber** (`course_sub`):

```sql
SELECT * FROM shop.products WHERE sku = 'Z9';
```

**Expected:** the row appeared without a manual INSERT on the subscriber.

## Task 6. DDL doesn't propagate (demonstration)

On the primary:

```sql
ALTER TABLE shop.products ADD COLUMN color text;
```

On the subscriber:

```sql
\d shop.products
```

There's **no** `color` column — the subscription doesn't apply DDL. You need to do it manually:

```sql
ALTER TABLE shop.products ADD COLUMN color text;
```

Write down the takeaway: "after DDL on the primary — ALTER on the subscriber, otherwise a pipeline error."

## Task 7. Cleanup (optional)

```sql
\c course_sub
DROP SUBSCRIPTION lab_sub;
\c course
DROP PUBLICATION lab_pub;
SELECT pg_drop_replication_slot('lab_sub');  -- name from pg_replication_slots
```

## If something went wrong

| Symptom | Fix |
|---------|---------|
| `could not connect` | CONNECTION string, hba, password |
| `relation does not exist` | Table on the subscriber before the subscription |
| `logical decoding requires wal_level` | restart after logical |
| Duplicates on copy_data | Empty the subscriber table before subscribing |
| Slot exists | DROP SUBSCRIPTION ... ; DROP SLOT |

## Success criteria

- [ ] `wal_level = logical`
- [ ] INSERT on the primary is visible on `course_sub`
- [ ] `pg_stat_subscription` is in a working state
- [ ] You understand `copy_data` and the lack of DDL sync

## Next

PITR: [09-pitr.md](09-pitr.md).
