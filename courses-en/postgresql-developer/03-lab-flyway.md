# 03. Lab: Flyway

## Why this lab

Walk the full cycle: `flyway info` → `migrate` → verify schema and FTS from V2 — like CI before a shop-api deploy.

## Prerequisites

- [`deploy/postgres`](../../deploy/postgres/README.md) running
- [Flyway CLI](https://flywaydb.org/download) installed
- [02-flyway](02-flyway.md)

## Task 1. Check config

```bash
cd courses/postgresql-developer/examples/flyway
cat flyway.conf
flyway info
```

Expected: V1, V2 in status **Pending** (clean DB) or **Success** (already migrated).

## Task 2. migrate

```bash
flyway migrate
flyway info
```

Expected: all scripts `Success`, no `Failed`.

On error:

```bash
flyway info   # which version failed
# fix SQL, flyway repair (dev only) or reset DB
```

## Task 3. Verify schema

```bash
psql "postgresql://course:course@localhost:5432/course" -c "\dt devapp.*"
psql "postgresql://course:course@localhost:5432/course" -c \
  "SELECT version, description, success FROM flyway_schema_history ORDER BY installed_rank;"
```

Expected:

| Table | Present |
|---------|------|
| `devapp.products` | ✅ |
| `devapp.orders` | ✅ |
| column `products.search` | ✅ (V2) |

## Task 4. FTS after V2

```sql
INSERT INTO devapp.products (sku, name, price)
VALUES ('A1', 'Widget Pro', 9.99);

SELECT sku, name, search
FROM devapp.products
WHERE search @@ plainto_tsquery('simple', 'widget');
```

Expected: 1 row — trigger updated `search` on INSERT.

```sql
UPDATE devapp.products SET name = 'Super Widget' WHERE sku = 'A1';
SELECT search @@ plainto_tsquery('simple', 'super') AS matches;
```

Expected: `matches = t`.

## Task 5. validate

```bash
flyway validate
```

Expected: success. Change a byte in `V1__init.sql` locally — validate should **fail** (restore the file).

## Reset the stand (optional)

```bash
# in deploy/postgres
docker compose down -v && docker compose up -d
```

Or:

```sql
DROP SCHEMA devapp CASCADE;
TRUNCATE flyway_schema_history;  -- dev only!
```

## Troubleshooting

| Problem | Cause | Fix |
|----------|---------|-----|
| Connection refused | Postgres down | docker compose up |
| Schema devapp does not exist | schemas= mismatch | flyway.conf |
| Checksum mismatch | edited applied SQL | repair / reset |
| EXECUTE FUNCTION error | PG < 14 | `EXECUTE PROCEDURE` in trigger |

## Success criteria

- [ ] `flyway migrate` without errors
- [ ] `devapp.products`, `devapp.orders` exist
- [ ] FTS on INSERT/UPDATE works
- [ ] `flyway validate` OK
- [ ] Understanding of flyway_schema_history

## Next

Liquibase: [04-liquibase.md](04-liquibase.md).
