# 03. Lab: SCRAM

## Why this lab

Create a role with SCRAM, connect from a host, check `password_encryption`, and write up **3 hardening items** for `pg_hba.conf`.

## Prerequisites

- Environment [`deploy/postgres`](../../deploy/postgres/README.md)
- [02-scram-auth](02-scram-auth.md)

## Task 1. password_encryption

```sql
SHOW password_encryption;
```

Expected: `scram-sha-256`. If `md5`:

```sql
ALTER SYSTEM SET password_encryption = 'scram-sha-256';
-- restart if needed
```

## Task 2. New role

```sql
CREATE ROLE app_readonly LOGIN PASSWORD 'LabReadOnly2024!';
GRANT CONNECT ON DATABASE course TO app_readonly;
GRANT USAGE ON SCHEMA shop TO app_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA shop TO app_readonly;
```

Check SCRAM in the catalog (superuser):

```sql
SELECT rolname, left(rolpassword, 20) AS pwd_prefix
FROM pg_authid WHERE rolname = 'app_readonly';
```

Expected: prefix `SCRAM-SHA-256$`

## Task 3. Connection

```bash
psql "postgresql://app_readonly:LabReadOnly2024!@localhost:5432/course" \
  -c "SELECT current_user, current_database();"
```

INSERT should fail:

```bash
psql "postgresql://app_readonly:LabReadOnly2024!@localhost:5432/course" \
  -c "INSERT INTO shop.products (sku,name,price) VALUES ('x','y',1);"
```

## Task 4. pg_hba review

```bash
docker exec mock-postgres grep -v '^#' /var/lib/postgresql/data/pg_hba.conf | grep -v '^$'
```

Document `pg_hba-hardening.md` — **3 items**:

1. Replace `trust` / the wide `0.0.0.0/0` with the app subnet CIDR + `scram-sha-256`
2. Use `hostssl` for remote (after [09-lab-ssl](09-lab-ssl.md))
3. An explicit `reject` line at the end

Example of a target line:

```text
hostssl  course  app_readonly  10.0.1.0/24  scram-sha-256
```

## Task 5. Forbidding the weak (tabletop)

| Anti-pattern | Risk | Fix |
|--------------|------|-----|
| trust 0.0.0.0/0 | Anyone connects | reject + CIDR |
| shared superuser URL in app | Full compromise | shop_app role |
| password in git | leak | Vault |

## Success criteria

- [ ] Login app_readonly OK
- [ ] password_encryption = scram-sha-256
- [ ] pwd prefix SCRAM in pg_authid
- [ ] pg_hba hardening 3 items documented

## Next

LDAP: [04-ldap-ad.md](04-ldap-ad.md).
