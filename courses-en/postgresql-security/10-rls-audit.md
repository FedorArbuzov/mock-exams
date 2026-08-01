# 10. RLS and audit

## Real-world scenario

SaaS shop: one PostgreSQL, thousands of tenants. A bug in the API — the `WHERE tenant_id` was forgotten. Without **RLS**, an analyst sees all orders. With RLS + `SET app.tenant_id` — even with a forgotten WHERE, Postgres filters the rows. But SUPERUSER and `BYPASSRLS` bypass the policy — the app is **never** superuser.

RLS is authorization at the row level; pgaudit is who did what. For multi-tenant you need **both**.

**Prerequisites:** [basic/05-roles-privileges](../postgresql-basic/05-roles-privileges.md), [advanced/07-security](../postgresql-advanced/07-security.md).

## What you'll learn

- `ENABLE ROW LEVEL SECURITY` and policies
- `USING` vs `WITH CHECK`
- `BYPASSRLS` and SUPERUSER
- `security_barrier` views
- The link between RLS + pgaudit

## Basic pattern

```sql
ALTER TABLE shop.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop.orders FORCE ROW LEVEL SECURITY;

CREATE POLICY orders_tenant ON shop.orders
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::int)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::int);
```

| Part | Purpose |
|-------|------------|
| `ENABLE` | Enables RLS for non-owners |
| `FORCE` | RLS even for the table owner (except superuser) |
| `USING` | Which rows are visible (SELECT, UPDATE, DELETE) |
| `WITH CHECK` | Which rows can be INSERT/UPDATE'd |
| `true` in `current_setting` | NULL if the GUC isn't set — no match |

## Setting the tenant in the application

```python
# SQLAlchemy — at the start of each transaction / request
await conn.execute(text("SET LOCAL app.tenant_id = :tid"), {"tid": tenant_id})
```

`SET LOCAL` — resets at the end of the transaction (safer than a session-level `SET`).

PgBouncer transaction mode: `SET LOCAL` inside a transaction is OK.

## Bypassing RLS

| Role | RLS |
|------|-----|
| Regular user | Policies apply |
| Table owner without FORCE | Can see everything |
| `BYPASSRLS` attribute | Bypass |
| SUPERUSER | Bypass |

```sql
SELECT rolname, rolbypassrls, rolsuper FROM pg_roles WHERE rolname = 'shop_app';
```

`shop_app` — `rolbypassrls = false`, `rolsuper = false`.

## Security definer views — a trap

```sql
CREATE VIEW shop.orders_safe WITH (security_barrier) AS
  SELECT id, amount
  FROM shop.orders
  WHERE tenant_id = current_setting('app.tenant_id', true)::int;
```

Without `security_barrier`, the optimizer may "push down" a predicate and **leak** rows through a side channel.

Preferred: RLS on the base table, a thin view.

## Policies per operation

```sql
CREATE POLICY orders_select ON shop.orders FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::int);

CREATE POLICY orders_insert ON shop.orders FOR INSERT
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::int);
```

Separate policies — fine-grained (a read-only role without an INSERT policy).

## RLS does not replace audit

| Event | RLS | pgaudit |
|---------|-----|---------|
| User sees others' rows | Blocks | — |
| User tries to DROP TABLE | — | Logs |
| Admin BYPASSRLS SELECT | Allows | Should log `read` or write |

During an incident: pgaudit is "who", RLS is "what they could see".

## Common mistakes

1. RLS enabled, GUC not set — an empty result (silent fail).
2. INSERT of someone else's `tenant_id` without `WITH CHECK` — a leak.
3. App running as the `postgres` superuser — RLS is useless.
4. Only an app filter, without RLS — psql bypass.
5. Forgot `FORCE RLS` — the owner role in migrations sees everything.

## Checklist

- [ ] USING + WITH CHECK for tenant
- [ ] SET LOCAL in the app / middleware
- [ ] App role without BYPASSRLS/SUPERUSER
- [ ] FORCE ROW LEVEL SECURITY on sensitive tables
- [ ] pgaudit ddl + write on the same tables

## Next

Lab: [11-lab-rls.md](11-lab-rls.md). Example: [`examples/rls-tenant.sql`](examples/rls-tenant.sql).
