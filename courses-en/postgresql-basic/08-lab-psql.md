# 08. Lab: psql and Metadata

When an API is slow, a DBA does not start with restart. The first step is visibility: who is connected, what is blocked, what is large (`pg_stat_activity`, locks, table sizes). Without these basics, developers often blame "Postgres bugs."

This lab trains practical diagnostics and `\copy`, which are useful both on-call and in interviews.

## What you need

- Running environment with `shop` schema data ([04-lab-ddl](04-lab-ddl.md)).
- Two `psql` sessions (two terminals/tabs) are useful for activity checks.

## Task 1. Who is connected

In first session as `course`:

```sql
SELECT pid,
       usename,
       application_name,
       client_addr,
       state,
       left(query, 80) AS query
FROM pg_stat_activity
WHERE datname = 'course'
  AND pid <> pg_backend_pid()
ORDER BY pid;
```

`pg_backend_pid()` excludes your current session.

Open second session:

```bash
psql "postgresql://shop_reader:reader_pass@localhost:5432/course?application_name=lab08-reader"
```

Run first query again and verify `shop_reader` + `application_name=lab08-reader`.

## Task 2. Table description and indexes

```sql
\d shop.products
\d+ shop.orders
```

`\d+` also shows size/storage info. Compare with [04-lab-ddl](04-lab-ddl.md): PK, UNIQUE, FK, `orders_created_idx`.

List indexes via SQL:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'shop' AND tablename = 'orders';
```

## Task 3. CSV export via \copy

From host with local psql:

```sql
\copy (SELECT id, sku, name, price FROM shop.products) TO 'products.csv' CSV HEADER
```

Via Docker (stdout redirected to file):

```bash
docker exec mock-postgres psql -U course -d course \
  -c "\copy (SELECT * FROM shop.products) TO STDOUT CSV HEADER" > products.csv
```

Check file contains header + rows.

Optional import into temp table:

```sql
CREATE TEMP TABLE products_import (LIKE shop.products INCLUDING ALL);
\copy products_import FROM 'products.csv' CSV HEADER
SELECT count(*) FROM products_import;
```

## Task 4. Query timing

```sql
\timing on
SELECT count(*) FROM shop.orders o JOIN shop.products p ON p.id = o.product_id;
\timing off
```

On small data this is milliseconds; after [10-lab-indexes](10-lab-indexes.md), impact is more visible.

## Task 5. Lock preview

Usually empty in this basic lab, but useful query:

```sql
SELECT locktype, relation::regclass, mode, granted
FROM pg_locks
WHERE NOT granted
LIMIT 5;
```

You will see lock waits clearly in [12-lab-mvcc](12-lab-mvcc.md).

## Task 6. Useful one-liners

```sql
-- version and session params
SELECT version(), current_setting('search_path');

-- total size of shop schema
SELECT pg_size_pretty(sum(pg_total_relation_size(relid)))
FROM pg_stat_user_tables
WHERE schemaname = 'shop';
```

## If something goes wrong

| Symptom | Fix |
|---------|-----|
| `\copy: permission denied` | host path issue; use Docker stdout method |
| second session not visible | check `datname` filter and DB in connection string |
| `\d` says no relations | `shop` schema missing; return to lab 04 |

## You're done when

- [ ] You can find sessions in `pg_stat_activity`
- [ ] `\d shop.products` shows expected constraints/indexes
- [ ] CSV export works via `\copy`
- [ ] You used `\timing` and read query duration

## What's next

Indexes and plans: [09-indexes-explain.md](09-indexes-explain.md).
