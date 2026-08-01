# 04. LDAP / Active Directory

## Real-world scenario

The company centralizes identity in **Active Directory**. DevOps doesn't want 200 passwords in Postgres. An **LDAP bind** in `pg_hba` lets a user log in with their corporate password; in Postgres you still need a `LOGIN` role with a GRANT.

In AWS, instead of LDAP, there's **IAM database authentication** for RDS. The choice of method is an org policy.

## What you'll learn

- The LDAP auth flow in Postgres
- The pg_hba line for LDAP
- RDS IAM / Azure patterns
- vs SCRAM local — tradeoffs

## Flow

```text
psql client
    → PostgreSQL (pg_hba: ldap)
        → LDAP/AD bind (ldapserver:636 TLS)
            → success → PG checks role exists + GRANT
```

PostgreSQL does **not** create roles automatically from LDAP (without extra tooling). Typically:

```sql
CREATE ROLE jdoe LOGIN;  -- no PASSWORD with ldap auth
GRANT shop_app TO jdoe;
```

## pg_hba ldap

```text
host all ldapuser 10.0.0.0/8 ldap ldapserver=ldap.corp.local ldapport=636 ldaptls=1 ldapbasedn="dc=corp,dc=local"
```

| Parameter | Meaning |
|----------|-------|
| `ldapserver` | Host AD/LDAP |
| `ldapport` | 636 LDAPS |
| `ldaptls` | TLS to LDAP |
| `ldapbasedn` | Search base |

PG documentation: LDAP authentication. Test against a staging AD.

## Revoking access

1. Disable the user in AD — instant for new binds.
2. `REVOKE` / `DROP ROLE` in PG — remove the GRANT.
3. `pg_terminate_backend` for active sessions.

Faster than rotating the SCRAM password on 50 roles.

## LDAP unavailability

| State | Behavior |
|-----------|-----------|
| LDAP down | **New** logins fail; existing sessions live on |
| Break-glass | A local SCRAM role `dba_breakglass`, only from the bastion |

Plan break-glass **outside** LDAP.

## RDS / cloud

| Platform | Method |
|-----------|-------|
| AWS RDS | IAM DB auth token ([aws-intermediate](../aws-intermediate/README.md)) |
| Azure | Entra ID / managed identity patterns |
| Self-hosted | LDAP or SCRAM + Vault |

An IAM token is short-lived; the application requests it via the AWS SDK.

## vs SCRAM local

| | LDAP/AD | SCRAM local |
|---|---------|-------------|
| Centralization | Yes | Per-database |
| Dependency | LDAP SLA | Only PG |
| Offboarding | AD disable | ALTER ROLE / DROP |
| Complexity | hba + AD certs | Simpler |
| Cloud native | Often IAM is better | SCRAM + secrets |

## Common mistakes

1. LDAP without TLS — passwords in clear to AD.
2. Forgot the role in PG — LDAP OK, `role does not exist`.
3. All humans SUPERUSER in PG "because they're AD admin."
4. No break-glass — an LDAP outage = total lockout.

## Checklist

- [ ] A role in PG is required for LDAP auth
- [ ] Revoke: AD + PG
- [ ] TLS to LDAP (636)
- [ ] Break-glass local role
- [ ] RDS IAM as an alternative

## Next

Tabletop lab: [05-lab-ldap.md](05-lab-ldap.md). Optional: [optional-ldap.md](optional-ldap.md).
