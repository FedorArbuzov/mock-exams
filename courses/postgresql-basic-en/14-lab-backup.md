# 14. Lab: Dump and Restore

A backup you never restored is not a backup. In this lab you dump schema `shop`, intentionally drop it, restore from file, and verify data + objects. This is a minimal pre-release recovery drill.

## What you need

- `shop` schema with data (from [04-lab-ddl](04-lab-ddl.md), optionally expanded in [10-lab-indexes](10-lab-indexes.md))
- `pg_dump` / `pg_restore` available either on host or via Docker commands

Record baseline counts:

```sql
SELECT count(*) FROM shop.products;
SELECT count(*) FROM shop.orders;
```

## Task 1. Dump schema `shop` (custom format)

Host version:

```bash
pg_dump -Fc -n shop -f shop.dump "postgresql://course:course@localhost:5432/course"
```

Docker version:

```bash
docker exec mock-postgres pg_dump -U course -Fc -n shop -f /tmp/shop.dump course
docker cp mock-postgres:/tmp/shop.dump ./shop.dump
```

Check file exists and has size > 0.

List dump contents:

```bash
pg_restore -l shop.dump
```

## Task 2. Drop schema (controlled disaster)

```sql
DROP SCHEMA shop CASCADE;
\dn
SELECT count(*) FROM pg_tables WHERE schemaname = 'shop';
```

Expected: schema is gone and querying `shop.*` fails.

Do **not** drop whole `course` database.

## Task 3. Restore

Host:

```bash
pg_restore -d "postgresql://course:course@localhost:5432/course" shop.dump
```

Docker:

```bash
docker cp shop.dump mock-postgres:/tmp/shop.dump
docker exec mock-postgres pg_restore -U course -d course /tmp/shop.dump
```

Validate:

```sql
\dt shop.*
SELECT count(*) FROM shop.products;
SELECT count(*) FROM shop.orders;
```

Counts should match baseline.

## Task 4. Globals and roles

```bash
docker exec mock-postgres pg_dumpall -U course --globals-only
```

Look for role definitions (`shop_reader`, `shop_writer`) if created earlier.  
Schema dump alone does not carry role creation.

## Task 5. Schema-only dump (optional)

```bash
docker exec mock-postgres pg_dump -U course --schema-only -n shop -f /tmp/shop_schema.sql course
```

Useful for migration review and DDL comparison.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `pg_restore: could not open file` | wrong path / missing copy to container |
| `schema already exists` | partial restore, drop schema and retry |
| `permission denied` | restore as `course` in this training setup |
| restored tables empty | dumped schema-only by mistake |
| roles missing | restore globals or recreate grants from lab 06 |

## You're done when

- [ ] Created `shop.dump` in custom format
- [ ] Dropped and restored `shop` successfully
- [ ] Post-restore row counts match baseline
- [ ] Understand `-n shop`
- [ ] Understand roles/global objects restore path

## What's next

Final project: [15-final-project.md](15-final-project.md).
