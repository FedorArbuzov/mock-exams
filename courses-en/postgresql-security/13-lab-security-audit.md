# 13. Lab: security audit

## Why this lab

Run a **mini security assessment** of your environment: SQL queries for weak roles, a pg_hba review, a findings report — as before an internal audit or pentest readiness.

## Prerequisites

- Lessons 01–12
- [`examples/audit-queries.sql`](examples/audit-queries.sql)

## Task 1. SQL audit queries

```bash
psql "postgresql://course:course@localhost:5432/course" \
  -f courses/postgresql-security/examples/audit-queries.sql
```

Interpretation:

**Weak login roles** (`rolsuper`, `rolcreaterole`, `rolcreatedb`):

```sql
SELECT rolname, rolsuper, rolcreaterole, rolcreatedb, rolcanlogin
FROM pg_roles
WHERE rolcanlogin AND (rolsuper OR rolcreaterole OR rolcreatedb);
```

Expected in the lab: possibly `course` with elevated privileges — record it as a finding.

**Login without a password:**

```sql
SELECT rolname FROM pg_authid
WHERE rolcanlogin AND rolpassword IS NULL;
```

LDAP-only roles — OK; local without a password — a finding.

**PUBLIC CREATE on a schema:**

```sql
SELECT nspname FROM pg_namespace n
WHERE has_schema_privilege('PUBLIC', n.oid, 'CREATE');
```

## Task 2. Extended checks

Add to your report:

```sql
-- RLS disabled on user tables in sec/shop
SELECT n.nspname, c.relname, c.relrowsecurity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname IN ('sec', 'shop')
  AND c.relkind = 'r'
  AND NOT c.relrowsecurity;

SHOW password_encryption;
SHOW ssl;
SHOW log_connections;
```

## Task 3. pg_hba review

```bash
docker exec mock-postgres grep -v '^#' /var/lib/postgresql/data/pg_hba.conf | grep -v '^$'
```

Note:

| Pattern | Severity | Example |
|---------|----------|--------|
| `trust` | Critical | local trust |
| `0.0.0.0/0` wide open | High | any host |
| `md5` | Medium | downgrade from SCRAM |
| `host` without ssl remote | Medium | cleartext data |

## Task 4. Findings report

A one-page `security-audit-report.md`:

| # | Finding | Severity | Evidence | Remediation |
|---|---------|----------|----------|-------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |
| 4 | | | | |
| 5 | | | | |

Examples of typical findings (if the lab is clean — use them as tabletop):

| Finding | Severity | Remediation |
|---------|----------|-------------|
| trust in hba for the docker network | Critical | scram + CIDR + reject |
| course role superuser-like | High | separate app/migrator roles |
| No pgaudit ddl | Medium | enable pgaudit.log |
| ssl=off | High | ssl=on + hostssl |
| No RLS on orders | High | ENABLE RLS + policies |

## Task 5. Prioritization

Sort the findings: **Critical → Low**. The first 2 fixes — in sprint 1.

## Troubleshooting

| Problem | Fix |
|----------|-----|
| docker exec fails | is the `mock-postgres` container running? |
| audit-queries permission | connect as course/postgres |
| Empty output of weak roles | good — document "clean" |

## Success criteria

- [ ] audit-queries run, output interpreted
- [ ] pg_hba review with notes
- [ ] ≥5 findings with remediation
- [ ] Prioritization Critical first

## Next

Final project: [14-final-project.md](14-final-project.md).
