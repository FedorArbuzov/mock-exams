# 05. Roles, Privileges, Security

Security audit finds production FastAPI using `postgres` SUPERUSER in connection string. If app is compromised, attacker gets full cluster control. At the same time an analyst cannot connect because team forgot `GRANT USAGE ON SCHEMA`. DevOps edits `pg_hba.conf` and reloads — but forgets rules are matched top-to-bottom, first match wins; result is either reject for everyone or (worse) `trust` for `0.0.0.0/0`.

In Postgres there is no separate "user" and "group" entity — both are **roles**. This chapter gives a minimal privilege model for apps, CI, and humans.

In this chapter:

- LOGIN / NOLOGIN roles and common split: migrator / app / readonly
- GRANT levels: database -> schema -> table -> column
- `ALTER DEFAULT PRIVILEGES` for future tables
- `pg_hba.conf` and SCRAM-SHA-256 basics
- Why apps must not use SUPERUSER (RLS preview)

## Roles = Users and Groups

```sql
CREATE ROLE app_reader LOGIN PASSWORD 'changeme';
CREATE ROLE app_writer LOGIN PASSWORD 'changeme';
CREATE ROLE app_group NOLOGIN;
GRANT app_group TO app_reader;
```

| Attribute | Meaning |
|-----------|---------|
| `LOGIN` | can authenticate/connect |
| `NOLOGIN` | group role, grants inherited via `GRANT role TO user` |
| `SUPERUSER` | bypasses almost all checks (break-glass only) |
| `CREATEDB` / `CREATEROLE` | administrative capabilities, not runtime app defaults |

In this training environment, `course` is superuser for convenience. In [06-lab-roles](06-lab-roles.md) you create `shop_reader` and `shop_writer`.

## GRANT by levels

Privileges are **not** auto-inherited through hierarchy. You need a chain:

```sql
GRANT CONNECT ON DATABASE course TO app_reader;
GRANT USAGE ON SCHEMA shop TO app_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA shop TO app_reader;

ALTER DEFAULT PRIVILEGES IN SCHEMA shop
  GRANT SELECT ON TABLES TO app_reader;
```

| Privilege | Level | Without it |
|-----------|-------|------------|
| `CONNECT` | database | cannot connect to DB |
| `USAGE` | schema | cannot access schema objects |
| `SELECT`, `INSERT`, ... | table | cannot operate on table data |
| `USAGE, SELECT` | sequence | `nextval` fails for serial/bigserial |
| `EXECUTE` | function | cannot call function |

Typical issue: team grants `SELECT ON ALL TABLES`, migration creates a new table, app fails with `permission denied`. Fix with `ALTER DEFAULT PRIVILEGES` from object owner role (often migrator).

## Least Privilege Model

| Role | Purpose | Rights |
|------|---------|--------|
| `shop_migrator` | CI / Flyway / Alembic | DDL in `shop` schema |
| `shop_app` | runtime FastAPI/Django | `SELECT, INSERT, UPDATE, DELETE` on required tables |
| `shop_report` | BI / analytics | read-only (`SELECT`) |
| `dba_human` | manual operations | elevated rights by policy, not default superuser |

App role should **never**:

- run as `SUPERUSER`;
- own objects created by a different migration role (privilege drift/confusion).

More compliance/audit content: [postgresql-security](../postgresql-security/README.md).

## SUPERUSER: break-glass only

SUPERUSER bypasses ownership, RLS, and many checks. Use only for emergency ops — not in application `DATABASE_URL`.

## pg_hba.conf: who can connect

Located in PGDATA. Rule format:

```text
# TYPE  DATABASE  USER       ADDRESS         METHOD
host    course    course     127.0.0.1/32    scram-sha-256
host    course    shop_app   10.0.0.0/8      scram-sha-256
host    all       all        0.0.0.0/0       reject
```

| Field | Meaning |
|-------|---------|
| TYPE | `local` (socket) or `host` (TCP) |
| DATABASE | DB name or `all` |
| USER | role or `all` |
| ADDRESS | CIDR for host rules |
| METHOD | `scram-sha-256`, `cert`, `reject`, ... |

**Order matters:** first matching line is applied.

```sql
SELECT pg_reload_conf();
```

If password is correct but auth still fails, often HBA match is wrong (or request comes from unexpected IP/network namespace).

## SCRAM-SHA-256

Modern password hashing/auth method in Postgres. Avoid MD5 for new setups. Check `password_encryption` and prefer `scram-sha-256`. More details: [security/02-scram-auth](../postgresql-security/02-scram-auth.md).

## Row Level Security (preview)

Even with correct GRANT, `SELECT` can expose all rows. **RLS** adds per-row policies:

```sql
ALTER TABLE shop.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON shop.orders
  USING (tenant_id = current_setting('app.tenant_id')::int);
```

Application sets `SET app.tenant_id = '42'` per session. Full topic: [security/10-rls-audit](../postgresql-security/10-rls-audit.md).

## Things people usually get wrong

1. One role for migrations and runtime app.
2. `GRANT ALL` just to "make it work."
3. Editing HBA without reload.
4. Storing plaintext connection secrets in git.

## Before you move on

- [ ] I can explain LOGIN vs NOLOGIN
- [ ] I know CONNECT -> USAGE -> SELECT chain
- [ ] I understand why `ALTER DEFAULT PRIVILEGES` matters
- [ ] I can read and explain an HBA rule
- [ ] Running app as SUPERUSER is not acceptable

## What's next

Lab: [06-lab-roles.md](06-lab-roles.md).
