# 11. Lab: RLS multi-tenant

## Why this lab

Verify **tenant isolation** at the Postgres level — not just in the ORM. A typical acceptance test for SaaS before prod.

## Prerequisites

- [10-rls-audit](10-rls-audit.md)
- Environment [`deploy/postgres`](../../deploy/postgres/README.md)

## Task 1. Prepare the schema

```bash
psql "postgresql://course:course@localhost:5432/course" \
  -f courses/postgresql-security/examples/rls-tenant.sql
```

The script creates:

- `sec.orders` with `tenant_id`
- RLS policies SELECT/INSERT
- role `app_user`

Check:

```sql
SELECT relrowsecurity, relforcerowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'sec' AND c.relname = 'orders';
```

Expected: `relrowsecurity = t`.

## Task 2. Tenant 1 — session A

```sql
SET app.tenant_id = '1';
INSERT INTO sec.orders (tenant_id, amount) VALUES (1, 100.00);
INSERT INTO sec.orders (tenant_id, amount) VALUES (1, 250.50);
SELECT * FROM sec.orders;
```

Expected: 2 rows, only `tenant_id = 1`.

## Task 3. Tenant 2 — session B

A new psql connection or:

```sql
RESET app.tenant_id;
SET app.tenant_id = '2';
SELECT * FROM sec.orders;
```

Expected: **0 rows** (tenant 1 not visible).

```sql
INSERT INTO sec.orders (tenant_id, amount) VALUES (2, 99.00);
SELECT * FROM sec.orders;
```

Expected: 1 row (tenant 2 only).

## Task 4. Attack: someone else's tenant_id

```sql
SET app.tenant_id = '2';
INSERT INTO sec.orders (tenant_id, amount) VALUES (1, 999.00);
```

Expected: **ERROR** — `WITH CHECK` violation (new row violates row-level security policy).

## Task 5. Role app_user (not superuser)

```bash
psql "postgresql://app_user:app_pass@localhost:5432/course" \
  -c "SET app.tenant_id=1; SELECT * FROM sec.orders;"
```

Expected: rows of tenant 1.

```bash
psql "postgresql://app_user:app_pass@localhost:5432/course" \
  -c "SET app.tenant_id=2; SELECT * FROM sec.orders;"
```

Expected: rows of tenant 2 only.

## Task 6. Bypass tabletop

```sql
-- as superuser course/postgres
SELECT * FROM sec.orders;  -- sees EVERYTHING without SET tenant
```

Document: why the migrator CI must not use a superuser at runtime.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|---------|-----|
| All rows visible | RLS off or superuser | ENABLE RLS, app role |
| Empty SELECT | GUC not set | SET app.tenant_id |
| INSERT of someone else's tenant OK | no WITH CHECK | add a policy |
| app_user permission denied | GRANT | rerun rls-tenant.sql |

## Success criteria

- [ ] Tenant 1 / 2 isolated
- [ ] INSERT with someone else's tenant_id rejected
- [ ] app_user works with SET tenant
- [ ] Superuser bypass documented

## Next

Compliance: [12-compliance.md](12-compliance.md).
