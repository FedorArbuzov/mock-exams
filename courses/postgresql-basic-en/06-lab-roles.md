# 06. Lab: Roles and GRANT

In [05-roles-privileges](05-roles-privileges.md) you saw least-privilege theory. Here you **split** access for schema `shop`: reader cannot write, writer cannot do DDL. This mirrors real production setup for API `DATABASE_URL` and read-only reporting access.

After this lab you can answer a common interview question confidently: "how do you grant app access only to one schema?"

## What you need

- `shop` schema from [04-lab-ddl](04-lab-ddl.md) exists.
- Connected as `course` (training superuser).

## Task 1. Create application roles

```sql
CREATE ROLE shop_reader LOGIN PASSWORD 'reader_pass';
CREATE ROLE shop_writer LOGIN PASSWORD 'writer_pass';
```

Check:

```sql
\du shop_*
```

## Task 2. Grant minimal privileges

```sql
GRANT CONNECT ON DATABASE course TO shop_reader, shop_writer;
GRANT USAGE ON SCHEMA shop TO shop_reader, shop_writer;

GRANT SELECT ON ALL TABLES IN SCHEMA shop TO shop_reader;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA shop TO shop_writer;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA shop TO shop_writer;
```

Why writer needs sequence permissions: `serial`/`bigserial` depend on sequences; without these grants `INSERT` can fail on `nextval`.

For future tables (if migrator is `course`):

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA shop
  GRANT SELECT ON TABLES TO shop_reader;
ALTER DEFAULT PRIVILEGES IN SCHEMA shop
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO shop_writer;
ALTER DEFAULT PRIVILEGES IN SCHEMA shop
  GRANT USAGE, SELECT ON SEQUENCES TO shop_writer;
```

## Task 3. Verify reader: SELECT yes, INSERT no

```bash
psql "postgresql://shop_reader:reader_pass@localhost:5432/course" \
  -c "SELECT count(*) FROM shop.products;"

psql "postgresql://shop_reader:reader_pass@localhost:5432/course" \
  -c "INSERT INTO shop.products (sku,name,price) VALUES ('x','y',1);"
```

| Query | Expected |
|-------|----------|
| `SELECT count(*)` | success |
| `INSERT` | permission denied error |

PowerShell or Docker version:

```bash
docker exec mock-postgres psql "postgresql://shop_reader:reader_pass@localhost:5432/course" -c "SELECT count(*) FROM shop.products;"
```

## Task 4. Verify writer

```bash
psql "postgresql://shop_writer:writer_pass@localhost:5432/course" \
  -c "INSERT INTO shop.products (sku,name,price) VALUES ('C3','Cable', 4.99) RETURNING id;"
```

Should return a new `id`.

Reader should still see inserted row:

```bash
psql "postgresql://shop_reader:reader_pass@localhost:5432/course" \
  -c "SELECT sku FROM shop.products WHERE sku = 'C3';"
```

## Task 5. Inspect ACL in psql

As `course`:

```sql
\dp shop.*
```

ACL output should match reader/writer split (`r`=SELECT, `a`=INSERT, ...).

## Task 6. application_name preview

```bash
psql "postgresql://shop_writer:writer_pass@localhost:5432/course?application_name=lab06" -c "SELECT 1;"
```

As `course`:

```sql
SELECT application_name, usename, state
FROM pg_stat_activity
WHERE application_name = 'lab06';
```

That is how teams distinguish app pool sessions from ad-hoc DBA sessions.

## If something goes wrong

| Symptom | Cause |
|---------|-------|
| `password authentication failed` | typo, non-LOGIN role, HBA mismatch |
| `permission denied for schema shop` | missing `USAGE ON SCHEMA` |
| `permission denied for sequence` | missing sequence grants for writer |
| reader can insert | connected as wrong role or extra grant exists |

To reset roles:

```sql
REASSIGN OWNED BY shop_reader TO course;
REASSIGN OWNED BY shop_writer TO course;
DROP OWNED BY shop_reader;
DROP OWNED BY shop_writer;
DROP ROLE shop_reader, shop_writer;
```

## You're done when

- [ ] `shop_reader`: SELECT works, INSERT denied
- [ ] `shop_writer`: INSERT/UPDATE works
- [ ] `\dp shop.*` confirms expected ACL split
- [ ] You understand why runtime should not use `course`

## What's next

Connections, psql, pools: [07-connections-psql.md](07-connections-psql.md).
