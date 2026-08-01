# PostgreSQL — Security (specialization)

A course on **threats**, **SCRAM**, **LDAP/IAM**, **pgaudit**, **encryption**, **RLS**, **compliance**, and a **security baseline** for production.

Format — **megacourse**: real-world scenarios, anti-patterns, labs with troubleshooting, and links to admin tracks and DevOps.

## Who it's for

- DBAs and platform engineers ahead of a SOC 2 / PCI audit
- Backend developers designing multi-tenant SaaS
- DevOps engineers configuring RDS / self-hosted Postgres

## Prerequisites

| Course | Why |
|------|-------|
| [`postgresql-basic`](../postgresql-basic/README.md) | 05–06 roles, connections |
| [`postgresql-advanced`](../postgresql-advanced/07-security.md) | RLS overview |
| [`secrets-basic`](../secrets-basic/README.md) | DATABASE_URL, Vault |
| [`appsec-fundamentals`](../appsec-fundamentals/README.md) | Threat modeling |

**Locally:** an image with `pgaudit` — [`deploy/postgres`](../../deploy/postgres/README.md).

## Curriculum

| # | Lesson | Type |
|---|------|-----|
| 1 | [Threat model](01-threat-model.md) | theory |
| 2 | [SCRAM-SHA-256](02-scram-auth.md) | theory |
| 3 | [Lab: SCRAM](03-lab-scram.md) | lab |
| 4 | [LDAP / Active Directory](04-ldap-ad.md) | theory |
| 5 | [Lab: LDAP (tabletop)](05-lab-ldap.md) | lab |
| 6 | [pgaudit](06-pgaudit.md) | theory |
| 7 | [Lab: pgaudit](07-lab-pgaudit.md) | lab |
| 8 | [Encryption](08-encryption.md) | theory |
| 9 | [Lab: SSL](09-lab-ssl.md) | lab |
| 10 | [RLS and audit](10-rls-audit.md) | theory |
| 11 | [Lab: RLS multi-tenant](11-lab-rls.md) | lab |
| 12 | [Compliance](12-compliance.md) | theory |
| 13 | [Lab: security audit](13-lab-security-audit.md) | lab |
| 14 | [Final project: Security Baseline](14-final-project.md) | project |

Optional: [LDAP deep dive](optional-ldap.md).

## Examples

| File | Lesson |
|------|------|
| [`examples/rls-tenant.sql`](examples/rls-tenant.sql) | 11 |
| [`examples/audit-queries.sql`](examples/audit-queries.sql) | 13 |
| [`examples/ssl/README.md`](examples/ssl/README.md) | 09 |

## What you should end up with

After the course you will:

- Build a threat model and defense in depth for Postgres
- Configure SCRAM, pg_hba without `trust`, TLS
- Understand LDAP/IAM vs local auth
- Enable pgaudit and read AUDIT in a SIEM
- Write RLS for multi-tenant with `SET LOCAL`
- Run a security audit (`audit-queries`, hba review)
- Assemble a **Security Baseline** for auditors

## Related tracks

```text
postgresql-basic → intermediate → advanced
                                      ↓
                    postgresql-security (this course)
                    postgresql-ops (backup security)
                    postgresql-developer (app + RLS)
```

Branch map: [`postgresql-path.md`](../postgresql-path.md).
