# 14. Final project: Security Baseline

## Real-world scenario

The new shop-api service is going into a production audit. Security asks for one document: a "PostgreSQL Security Baseline" — not scattered notes, but a **signable** artifact for a SOC 2 / internal review. You assemble everything from the course into a coherent baseline.

## Task

Write a **Security Baseline** document for PostgreSQL 16 (shop production) — **8–12 sections**, 4–8 pages.

Format: Markdown in the repository or Confluence — your choice.

## Required content

### 1. Threat model (brief)

Trust boundaries from [01-threat-model](01-threat-model.md): Internet → app → secrets → pooler → PG → backup.

Top 5 threats + a control for shop.

### 2. Authentication

| Element | Your decision |
|---------|--------------|
| Method | SCRAM / LDAP / IAM |
| `password_encryption` | scram-sha-256 |
| pg_hba matrix | role × subnet × method |

Example matrix:

| Database | Role | Source CIDR | Method |
|----------|------|-------------|--------|
| shop | shop_app | 10.0.1.0/24 | hostssl scram-sha-256 |
| shop | shop_migrator | CI runner IP | hostssl scram-sha-256 |
| * | * | 0.0.0.0/0 | reject |

**Forbidden:** `trust` for remote.

### 3. Authorization

```text
shop_app      — DML, no DDL, no BYPASSRLS
shop_migrator — DDL in shop schema, CI only
shop_readonly — SELECT, replica
dba_breakglass — elevated, MFA, logged, no app use
```

Link: [basic/05-roles](../postgresql-basic/05-roles-privileges.md).

### 4. Network

- Private subnet, security groups
- TLS `verify-full`
- No public RDS endpoint (or IP allowlist)

### 5. Audit

```sql
pgaudit.log = 'ddl, role, write'
log_connections = on
```

Retention: 90d hot, 1y cold. SIEM alerts: DROP, GRANT SUPERUSER.

### 6. Encryption

| Layer | Control |
|-------|---------|
| Transit | TLS 1.2+, verify-full |
| Disk | EBS encrypted / encrypted PVC |
| Backup | S3 SSE-KMS, no public ACL |
| WAL archive | Same as backup |

### 7. Multi-tenant RLS

Link to [`examples/rls-tenant.sql`](examples/rls-tenant.sql):

- `ENABLE` + `FORCE ROW LEVEL SECURITY`
- `SET LOCAL app.tenant_id` in the middleware
- App not superuser

### 8. Backup security

From [postgresql-ops](../postgresql-ops/README.md):

- Encrypted repo
- IAM least privilege on the bucket
- Restore drill quarterly
- Ransomware: immutable copy

### 9. Compliance mapping

Table from [12-compliance](12-compliance.md):

| Framework | Control | Baseline section | Status |
|-----------|---------|------------------|--------|
| SOC 2 | Logical access | §2, §3 | Implemented |
| PCI | Encrypt transit | §4, §6 | Implemented |
| GDPR | Erasure | §8 + policy | Partial |

### 10. Quarterly tasks

| Task | Frequency |
|------|-----------|
| Access review (pg_roles) | Quarterly |
| pg_hba diff vs baseline | Quarterly |
| Restore drill | Quarterly |
| Secret rotation | 90 days |
| CIS audit-queries | Quarterly |

## Table of contents template

```markdown
# Shop PostgreSQL Security Baseline v1.0
## 1. Scope and ownership
## 2. Threat model
## 3. Authentication and pg_hba
## 4. Roles and least privilege
## 5. Network and TLS
## 6. Audit logging
## 7. Encryption
## 8. Row Level Security
## 9. Backup and disaster recovery security
## 10. Compliance mapping
## 11. Operational procedures
## 12. Revision history
```

## Success criteria

- [ ] No `trust` for remote in the target configuration
- [ ] pgaudit classes with justification (why not `read`)
- [ ] pg_hba matrix filled in
- [ ] RLS pattern with SET LOCAL
- [ ] Link to ops runbooks (backup, incident)
- [ ] Compliance mapping ≥3 frameworks
- [ ] Quarterly calendar

## Self-review questions

1. Can a compromised app pod read all tenants? (RLS)
2. Can an ex-employee connect? (offboarding + hba)
3. Can we prove who ran a DROP? (pgaudit + retention)
4. Encrypted backup if the bucket leaks? (KMS + IAM)

## Related courses

| Course | Baseline section |
|------|-----------------|
| [postgresql-advanced/07](../postgresql-advanced/07-security.md) | RLS deep dive |
| [postgresql-ops](../postgresql-ops/README.md) | Backup §8 |
| [secrets-basic](../secrets-basic/README.md) | Credentials §2 |
| [aws-intermediate](../aws-intermediate/README.md) | RDS IAM §2 |

## Congratulations

The **postgresql-security** track is complete. The next specialization track: [postgresql-developer](../postgresql-developer/README.md).
