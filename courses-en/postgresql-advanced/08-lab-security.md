# 08. Lab: RLS multi-tenant

## Why this lab

Multi-tenant SaaS often isolates data via `tenant_id` + RLS instead of a separate DB per customer. You'll set up policies and verify that a cross-tenant INSERT is impossible.

## Prerequisites

- `shop.orders` exists
- Connect as `course` (superuser) for DDL; test under an app role

## Task 1. Prepare data

```sql
ALTER TABLE shop.orders ADD COLUMN IF NOT EXISTS tenant_id int NOT NULL DEFAULT 1;

UPDATE shop.orders SET tenant_id = 1 WHERE tenant_id IS NULL OR tenant_id = 1;

INSERT INTO shop.orders (product_id, qty, tenant_id)
SELECT product_id, 1, 2
FROM shop.products LIMIT 5;
```

Check without RLS (superuser sees everything):

```sql
SELECT tenant_id, count(*) FROM shop.orders GROUP BY 1;
```

## Task 2. Enable RLS and policies

```sql
ALTER TABLE shop.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_select ON shop.orders;
DROP POLICY IF EXISTS tenant_modify ON shop.orders;

CREATE POLICY tenant_select ON shop.orders FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::int);

CREATE POLICY tenant_modify ON shop.orders FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::int)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::int);
```

Superuser **bypasses** RLS. Create an app role:

```sql
CREATE ROLE shop_app_rls LOGIN PASSWORD 'app_rls_pass';
GRANT CONNECT ON DATABASE course TO shop_app_rls;
GRANT USAGE ON SCHEMA shop TO shop_app_rls;
GRANT SELECT, INSERT, UPDATE, DELETE ON shop.orders TO shop_app_rls;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA shop TO shop_app_rls;
-- do NOT grant BYPASSRLS
```

## Task 3. Tenant 1 vs tenant 2

```bash
psql "postgresql://shop_app_rls:app_rls_pass@localhost:5432/course" -c \
  "SET app.tenant_id = '1'; SELECT count(*) FROM shop.orders;"
```

```bash
psql "postgresql://shop_app_rls:app_rls_pass@localhost:5432/course" -c \
  "SET app.tenant_id = '2'; SELECT count(*) FROM shop.orders;"
```

**Expected:** different counts; tenant 2 doesn't see tenant 1.

## Task 4. Cross-tenant INSERT — denied

```bash
psql "postgresql://shop_app_rls:app_rls_pass@localhost:5432/course" -c \
  "SET app.tenant_id = '1'; INSERT INTO shop.orders (product_id, qty, tenant_id) VALUES (1, 1, 2);"
```

**Expected:** `new row violates row-level security policy` (WITH CHECK).

## Task 5. Without SET tenant_id

```bash
psql "postgresql://shop_app_rls:app_rls_pass@localhost:5432/course" -c \
  "SELECT count(*) FROM shop.orders;"
```

**Expected:** 0 rows or an error — not "all tenants".

## Task 6. FastAPI/Django integration (written)

In `rls-notes.md`, describe:

- Where to call `SET app.tenant_id` (middleware, `get_db`, connection pool).
- Why PgBouncer transaction mode requires `SET LOCAL` at the start of the transaction ([intermediate/15-pgbouncer](../postgresql-intermediate/15-pgbouncer.md)).

## If something goes wrong

| Symptom | Solution |
|---------|---------|
| All rows visible | Connected as superuser/course |
| INSERT went through with tenant 2 | No WITH CHECK; BYPASSRLS |
| permission denied | GRANT on orders |

## Success criteria

- [ ] RLS filters SELECT by tenant
- [ ] WITH CHECK blocks cross-tenant INSERT
- [ ] App role without BYPASSRLS
- [ ] Notes about SET in the application layer

## Next

Major upgrade: [09-major-upgrade.md](09-major-upgrade.md).
