# 07. SSL, Row Level Security, audit

## Real-world scenario

Pentest: the application connects with `sslmode=prefer` — MITM on a guest Wi‑Fi. Audit: an analyst with `SELECT` on `orders` sees **all** tenant_ids — RLS isn't enabled. Compliance: "who deleted the row?" — MySQL's binlog has it; in Postgres without **pgaudit** it's just guesses.

Advanced security — an overview before the full [postgresql-security](../postgresql-security/README.md) track.

## What you'll learn

- TLS for clients and `verify-full`
- RLS: policies, `BYPASSRLS`, session GUC
- Audit: pgaudit vs triggers vs logs
- Encryption at rest vs in column
- RDS limitations

## SSL/TLS

Server:

```ini
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_ca_file = 'root.crt'
```

Client:

```text
postgresql://app@host:5432/db?sslmode=verify-full&sslrootcert=/path/ca.pem
```

| sslmode | Protection |
|---------|--------|
| `disable` | None — dev only |
| `require` | Encryption, **without** hostname verification |
| `verify-full` | Encryption + CA + hostname — **production** |

Related: [security/09-lab-ssl](../postgresql-security/09-lab-ssl.md).

## Row Level Security

```sql
ALTER TABLE shop.orders ADD COLUMN tenant_id int NOT NULL DEFAULT 1;
ALTER TABLE shop.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY orders_tenant_select ON shop.orders
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::int);

CREATE POLICY orders_tenant_modify ON shop.orders
  FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::int)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::int);
```

The application, **per session/transaction**:

```sql
SET app.tenant_id = '42';
-- or SET LOCAL inside a BEGIN
```

| Role | Behavior |
|------|-----------|
| Regular app role | Sees only its own rows |
| `BYPASSRLS` attribute | Bypasses RLS — **not** for the app |
| `SUPERUSER` | Bypasses RLS |

**RLS without SET tenant** — `current_setting(..., true)` returns NULL → 0 rows or deny.

Policies are separate for SELECT / INSERT / UPDATE. `WITH CHECK` on INSERT — you can't insert someone else's tenant_id.

## Audit

| Method | Pro | Con |
|-------|------|-------|
| **pgaudit** | Centralized DDL/DML audit log | Log volume, configuration |
| `log_statement = 'ddl'` | Simple | No DML |
| Trigger → audit_table | Flexible | Overhead, maintenance |
| Application audit | Business context | Bypassed if the app is bypassed |

```sql
-- pgaudit preview
CREATE EXTENSION pgaudit;
-- shared_preload_libraries = 'pgaudit'
-- pgaudit.log = 'write, ddl'
```

Deeper dive: [security/06-pgaudit](../postgresql-security/06-pgaudit.md).

## Encryption

| Level | Implementation |
|---------|------------|
| **At rest** | LUKS, EBS encryption, RDS storage encryption |
| **In transit** | TLS |
| **Column** | `pgcrypto` `pgp_sym_encrypt`, app-level KMS |
| **TDE** | Enterprise / cloud proprietary |

Postgres doesn't encrypt data files transparently without an extension/cloud — rely on disk + TLS + secrets management ([secrets-basic](../secrets-basic/README.md)).

## RDS / Aurora (preview)

- No access to the `pg_hba.conf` file — parameter groups.
- `rds_superuser` ≠ full superuser.
- IAM database authentication — tokens instead of a password.
- See [13-cloud-k8s](13-cloud-k8s.md), [aws-intermediate/13-rds-private](../aws-intermediate/13-rds-private.md).

## Common mistakes

1. RLS enabled, the app doesn't SET — "empty lists" in prod.
2. `sslmode=require` in a compliance checklist — not enough.
3. An audit trigger without a retention policy — the audit table grows larger than prod.
4. Migrations under superuser — silently bypass RLS.

## Checklist

- [ ] RLS without SET app.tenant — safe? (no)
- [ ] require vs verify-full
- [ ] pgaudit vs trigger audit
- [ ] SUPERUSER / BYPASSRLS bypass RLS
- [ ] At rest vs in transit

## Next

Lab: [08-lab-security.md](08-lab-security.md).

**Deeper dive:** [postgresql-security](../postgresql-security/README.md).
