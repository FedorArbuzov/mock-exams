# 02. SCRAM-SHA-256

## Real-world scenario

An audit finds `password_encryption = md5` and the line `host all all 0.0.0.0/0 md5` in hba. An offline brute-force of the hash from a leaked PGDATA is possible. Migrating to **SCRAM-SHA-256** + `hostssl ... scram-sha-256` is the baseline for PG 14+.

SCRAM protects the **authentication process**; the password still has to be strong and stored in a secrets manager.

## What you'll learn

- Why MD5 is obsolete
- `password_encryption` and creating roles
- Password rotation
- `pg_hba.conf` without trust/md5 for remote

## Why not MD5

| | MD5 (legacy) | SCRAM-SHA-256 |
|---|--------------|---------------|
| Storage in PG | `md5` hash in `pg_authid` | SCRAM verifier |
| On the wire | vulnerable to replay/offline | challenge-response |
| PG default | up to 13 | 14+ default |

```sql
SHOW password_encryption;  -- scram-sha-256
```

New roles:

```sql
CREATE ROLE app1 LOGIN PASSWORD 'StrongP@ssw0rd!';
```

An existing role with MD5 — reset the password:

```sql
ALTER ROLE legacy_app PASSWORD 'NewStrongP@ssw0rd!';
```

## SCRAM and transit

SCRAM protects **authentication** even without TLS (better than plaintext). **TLS is still mandatory** for query data (`SELECT` results). Defense: SCRAM + `hostssl` ([09-lab-ssl](09-lab-ssl.md)).

## pg_hba hardening

```text
# TYPE   DATABASE   USER   ADDRESS          METHOD
hostssl  all        all    10.0.0.0/8       scram-sha-256
host     all        all    127.0.0.1/32     scram-sha-256
# reject all else
host     all        all    0.0.0.0/0        reject
```

Remove:

```text
host all all 0.0.0.0/0 trust
host all all 0.0.0.0/0 md5
```

After editing: `SELECT pg_reload_conf();`

## Password rotation

```sql
ALTER ROLE app1 PASSWORD 'NewP@ssw0rd!';
```

1. Update the Secret in Vault/K8s.
2. Rolling restart of app pods / pooler reload.
3. Revoke the old secret after a grace period.

PgBouncer: `auth_file` sync or `auth_query`.

## Checking the auth method

```sql
SELECT rolname, rolpassword IS NOT NULL AS has_password
FROM pg_authid
WHERE rolname = 'app1';
```

`rolpassword` starting with `SCRAM-SHA-256$` — SCRAM.

Connecting with a wrong password — `password authentication failed` (don't reveal "user exists" in app logs).

## Common mistakes

1. SCRAM in PG, but hba uses `md5` — a downgrade.
2. `trust` for the Docker network `0.0.0.0/0` "temporarily" for a year.
3. One password for app + migrator + human.
4. Password in a CI log via `flyway -password=`.

## Checklist

- [ ] SCRAM vs MD5 — why
- [ ] SCRAM does not replace TLS for data
- [ ] Hash only in PGDATA / pg_authid
- [ ] hba without trust for remote
- [ ] A password rotation process

## Next

Lab: [03-lab-scram.md](03-lab-scram.md).
