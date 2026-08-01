# 01. Threat model

## Real-world scenario

A pentest found `DATABASE_URL` in git with `postgres:postgres` and `sslmode=disable`. In parallel, an analyst with the `SELECT` role on the whole database exported PII — RLS was not enabled. A backup S3 bucket was public "for an hour" — a compliance escalation. Without a **threat model**, every fix is one-off and holes remain.

A security course starts with trust boundaries and layered controls — not with "let's turn on SSL and be done."

**Prerequisites:** [basic/05-roles-privileges](../postgresql-basic/05-roles-privileges.md), [advanced/07-security](../postgresql-advanced/07-security.md).

## What you'll learn

- Trust boundaries in a typical stack
- A table of threats and controls
- Least privilege for app / migrator / human
- Defense in depth for Postgres

## Trust boundaries

```text
Internet
    → WAF / LB (TLS termination?)
        → App (FastAPI/Django) — SQL injection surface
            → Secrets (Vault / K8s Secret) — DATABASE_URL
                → PgBouncer (pool) — tenant GUC?
                    → PostgreSQL — pg_hba, roles, RLS
                        → OS / VM / K8s node
                            → Storage (EBS/PVC) — encryption at rest
                                → Backups (S3) — off-site, IAM
                                    → WAL archive — same risk as backup
```

Each arrow is an attack point. Postgres is **not** the only perimeter.

## Threats and controls

| Threat | Example | Control |
|--------|--------|----------|
| Password interception | MITM on café Wi‑Fi | TLS `verify-full`, SCRAM |
| SQL injection | `'; DROP TABLE--` | Parameterized queries, least privilege role |
| Backup leak | Open S3 bucket | SSE-KMS, IAM, no public |
| Insider DBA | SELECT * customers | pgaudit, RLS, no app SUPERUSER |
| App compromise | RCE in an API pod | RLS + DB role without DDL |
| Ransomware | Encrypt PGDATA | Immutable offline backups ([ops](../postgresql-ops/README.md)) |
| Credential stuffing | Weak password in staging | SCRAM, rotation, secrets manager |
| Supply chain | Malicious migration | Reviewed CI migrations |

## Least privilege (roles)

| Role | Privileges | Connection |
|------|-------|-------------|
| `shop_app` | DML on required tables | Runtime pods |
| `shop_migrator` | DDL in schema app | CI only, not in app |
| `shop_readonly` | SELECT reporting | BI, read replica |
| `dba_human` | Elevated, **not** SUPERUSER | Break-glass, MFA, logged |
| `postgres` / SUPERUSER | Everything | Emergency only |

The application is **never** SUPERUSER — it bypasses RLS, `COPY PROGRAM`, file access.

See [basic/06-lab-roles](../postgresql-basic/06-lab-roles.md), [secrets-basic](../secrets-basic/README.md).

## Defense in depth

```text
Network (private subnet, SG) 
  + pg_hba (CIDR, hostssl)
  + Auth (SCRAM / LDAP / IAM)
  + Authorization (GRANT)
  + RLS (tenant)
  + Audit (pgaudit)
  + Encryption (TLS + at rest)
```

One layer fails — the next one holds.

## Questions for your environment

| Question | Where to find the answer |
|--------|------------------|
| Who reads WAL/archive? | IAM, backup role |
| Where are connection strings? | K8s Secret, Vault — not git |
| Backup bucket compromise? | Restore drill, incident runbook |
| Who has SUPERUSER? | `pg_roles`, quarterly review |

## Common mistakes

1. "DB in a private subnet" — but the app is on the same network with a SQL injection surface.
2. Security only on prod — staging with a copy of prod data and `trust`.
3. Auditing only in the application — psql bypass.
4. RLS without SET tenant in the middleware — empty lists or a leak.

## Checklist

- [ ] Trust boundaries drawn for the shop API
- [ ] 5 threats with controls
- [ ] App without SUPERUSER — policy
- [ ] Backup/WAL access model
- [ ] Defense in depth — 4+ layers

## Next

SCRAM: [02-scram-auth.md](02-scram-auth.md).
