# 05. Lab: LDAP

## Why this lab

In production, LDAP is often unavailable in a learning environment. A **tabletop** reinforces the auth flow, pg_hba, access revocation, and the comparison with RDS IAM — without standing up AD.

## Prerequisites

- [04-ldap-ad](04-ldap-ad.md)
- An understanding of pg_hba ([03-lab-scram](03-lab-scram.md))

## Task 1. Flow diagram

Draw (text or mermaid):

```text
developer laptop
  → psql (TLS?)
    → PostgreSQL (pg_hba: ldap)
      → corporate LDAP/AD (port 636, LDAPS)
        → bind OK → PG checks role + GRANT
```

Answer:

| Question | Your answer |
|--------|-----------|
| Where is the password checked? | LDAP bind |
| Where are table privileges checked? | PostgreSQL GRANT |
| What if the role isn't in PG? | Login fails after LDAP OK |

## Task 2. pg_hba example

Copy and adapt it for `corp.local`:

```text
host all jdoe 10.0.0.0/8 ldap \
  ldapserver=ldap.corp.local \
  ldapport=636 \
  ldaptls=1 \
  ldapbasedn="dc=corp,dc=local"
```

Document:

- Why `ldaptls=1` is mandatory
- Why CIDR `10.0.0.0/8` and not `0.0.0.0/0`

## Task 3. LDAP unavailability

| Scenario | Behavior | On-call action |
|----------|-----------|------------------|
| LDAP down 5 min | New logins fail | Status page, wait |
| LDAP down 2 h | Devs blocked | Break-glass SCRAM role |
| Existing session | Lives until disconnect | `pg_terminate_backend` at offboarding |

Describe the **break-glass** role: who has access, MFA, audit.

## Task 4. LDAP groups → PG roles

PostgreSQL does **not** map AD groups automatically. A typical process:

```sql
-- HR offboarding ticket → automation
REVOKE shop_app FROM jdoe;
-- or
DROP ROLE jdoe;
```

Tabletop: group `CN=ShopDevelopers` → role `shop_app`:

| Step | Who | Action |
|-----|-----|----------|
| Onboard | IAM script | `CREATE ROLE jdoe LOGIN; GRANT shop_app TO jdoe` |
| Offboard | IAM script | `REVOKE ...; DROP ROLE` + AD disable |

Optional: [optional-ldap.md](optional-ldap.md).

## Task 5. Comparing auth methods

| Method | When | Pros | Cons |
|-------|-------|-------|--------|
| SCRAM | VM Postgres, small team | Simple, no LDAP SLA | Passwords per-DB |
| LDAP/AD | On-prem, corp SSO | Centralization | LDAP dependency |
| IAM token | AWS RDS | Short-lived, no static pwd | AWS-only, SDK in app |

For a shop API on RDS — which method and why?

## Troubleshooting (tabletop)

| Symptom | Cause | Fix |
|---------|---------|-----|
| `LDAP authentication failed` | Wrong password / AD lock | Reset AD |
| `role "jdoe" does not exist` | LDAP OK, PG role missing | CREATE ROLE + GRANT |
| `could not contact LDAP server` | Network / cert | Check 636, firewall |
| Login OK, permission denied | GRANT missing | `GRANT` on schema/table |

## Success criteria

- [ ] Flow diagram developer → LDAP → PG
- [ ] pg_hba example with LDAPS
- [ ] Revocation plan: AD disable + REVOKE/DROP
- [ ] Table SCRAM vs LDAP vs IAM
- [ ] Break-glass described

## Next

pgaudit: [06-pgaudit.md](06-pgaudit.md).
