# 12. Compliance

## Real-world scenario

A SOC 2 auditor arrives with a checklist: "Show me encryption at rest, access reviews, audit logs for Q2, who has SUPERUSER." The DBA opens pg_hba, the SIEM, IAM — or panics. A **compliance mapping** prepared in advance links frameworks to concrete Postgres controls from this course.

This is not legal advice — it's an engineering **mapping** for the shop PostgreSQL.

**Related:** [ops/backup](../postgresql-ops/README.md), [secrets-basic](../secrets-basic/README.md), [appsec-fundamentals](../appsec-fundamentals/README.md).

## What you'll learn

- PCI-DSS fragments for the DB
- SOC 2 logical access
- GDPR erasure vs backups
- CIS PostgreSQL Benchmark
- The Security Baseline artifact

## PCI-DSS (DB-relevant)

| Requirement | Control in the course |
|------------|------------------|
| Protect stored cardholder data | EBS/S3 encryption, no PAN in logs |
| Encrypt transmission | TLS verify-full ([08](08-encryption.md)) |
| Restrict access | Roles, RLS, no default passwords |
| Track access | pgaudit ([06](06-pgaudit.md)) |
| Secure configs | pg_hba no trust, CIS benchmark |

PAN in the DB — tokenization is preferable to a `pgcrypto` column.

## SOC 2 (Trust Services)

| Criterion | Postgres implementation |
|----------|-------------------------|
| Logical access | SCRAM/LDAP, least privilege |
| Change management | Migrations in CI, pgaudit DDL |
| Monitoring | log_connections, SIEM alerts |
| Incident response | Runbooks ([ops](../postgresql-ops/10-oncall-runbooks.md)) |

Evidence: git PR migrations, pgaudit logs, quarterly access review ticket.

## GDPR

| Topic | Practice |
|------|----------|
| Data mapping | Schema inventory: PII columns |
| Right to erasure | `DELETE` + policy for backups |
| Residency | EU RDS region, no US replica of EU PII |
| Breach notification | pgaudit + SIEM retention |

**Erasure vs backup:** deleting in the live DB doesn't wipe a past backup — legal needs a retention / re-encryption policy.

```sql
-- erasure request
DELETE FROM shop.customers WHERE id = $1;
-- backup: document "restores for erasure = separate process"
```

## CIS PostgreSQL Benchmark

Use it as an automated checklist (a version matching your PG):

| CIS item | Check |
|----------|----------|
| 4.x Authentication | scram-sha-256, no trust |
| 5.x Logging | log_connections, log_disconnections |
| 6.x Audit | pgaudit ddl, role |
| SSL | ssl=on, hostssl |

Script: [`examples/audit-queries.sql`](examples/audit-queries.sql).

## Security Baseline document

A single artifact for auditors — see [14-final-project](14-final-project.md):

```text
1. Threat model
2. Auth matrix (pg_hba)
3. Role model
4. Network/TLS
5. Audit (pgaudit + retention)
6. Encryption
7. RLS multi-tenant
8. Backup security
9. Compliance mapping (this table)
10. Quarterly tasks
```

## Quarterly tasks

| Task | Owner | Evidence |
|------|-------|----------|
| Access review | Security | Export pg_roles + tickets |
| SUPERUSER inventory | DBA | `SELECT * FROM pg_roles WHERE rolsuper` |
| Restore drill | DBA | [ops lab](../postgresql-ops/03-lab-pgbackrest.md) |
| Password/secret rotation | Platform | Vault audit log |
| pg_hba review | DBA | Diff vs baseline |
| CIS scan | Security | audit-queries output |

## Common mistakes

1. Compliance = "we're on RDS" without config evidence.
2. pgaudit enabled, retention 7 days — a SOC fail.
3. Staging = a copy of prod PII without masking.
4. SUPERUSER for 10 people "for convenience".
5. Backup encrypted, WAL archive — not.

## Checklist

- [ ] PCI/SOC/GDPR mapping for shop
- [ ] CIS checklist run on the environment
- [ ] Erasure policy vs backups
- [ ] Quarterly calendar set up
- [ ] Security Baseline outline ready

## Next

Audit lab: [13-lab-security-audit.md](13-lab-security-audit.md).
