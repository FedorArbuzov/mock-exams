# 09. Lab: SSL

## Why this lab

Enable TLS on PostgreSQL, connect with `sslmode=require`, and plan **verify-full** in K8s — without this, SCRAM protects only the password while query data goes in clear.

## Prerequisites

- [08-encryption](08-encryption.md)
- [`examples/ssl/README.md`](examples/ssl/README.md)
- OpenSSL on the host

## Task 1. Generate a certificate

```bash
cd courses/postgresql-security/examples/ssl
openssl req -new -x509 -days 365 -nodes -text \
  -out server.crt -keyout server.key -subj "/CN=mock-postgres"
chmod 600 server.key
```

Expected: files `server.crt`, `server.key` created.

## Task 2. Enable ssl in Postgres

Mount a volume and add a command to the compose (see the README in `examples/ssl/`):

```yaml
volumes:
  - ./examples/ssl:/var/lib/postgresql/ssl:ro
command:
  - "-c"
  - "ssl=on"
  - "-c"
  - "ssl_cert_file=/var/lib/postgresql/ssl/server.crt"
  - "-c"
  - "ssl_key_file=/var/lib/postgresql/ssl/server.key"
```

Restart:

```bash
docker compose -f deploy/postgres/docker-compose.yml up -d --force-recreate
```

Check inside:

```sql
SHOW ssl;  -- on
```

## Task 3. Connect with TLS

```bash
psql "postgresql://course:course@localhost:5432/course?sslmode=require" \
  -c "SELECT ssl_is_used();"
```

Expected: `ssl_is_used()` = `t` (PG 15+). On older versions — a successful connection without an SSL error.

Without ssl (if hba allows host):

```bash
psql "postgresql://course:course@localhost:5432/course?sslmode=disable" -c "SELECT 1;"
```

Note down: works or is rejected — depends on hba.

## Task 4. hostssl only (hardening)

Add to pg_hba (tabletop or for real):

```text
hostssl  all  all  10.0.0.0/8  scram-sha-256
host     all  all  0.0.0.0/0   reject
```

After `pg_reload_conf()` — `sslmode=disable` should **fail**.

## Task 5. verify-full in K8s (tabletop)

Describe the shop-api deployment:

| Step | Action |
|-----|----------|
| 1 | Secret `db-ca` with the corporate CA (not self-signed in prod) |
| 2 | Mount at `/etc/ssl/certs/db-ca.crt` |
| 3 | `sslmode=verify-full&sslrootcert=...` |
| 4 | Hostname in the cert = the RDS DNS endpoint |

Self-signed in the lab — `verify-full` will fail without `-k`/`sslrootcert` with your CA. For the lab, `require` is enough.

## Troubleshooting

| Error | Cause | Fix |
|--------|---------|-----|
| `server does not support SSL` | ssl=off | command ssl=on + restart |
| `could not read certificate` | wrong path/mount | check the volume |
| `private key file permissions` | key world-readable | chmod 600 |
| `certificate verify failed` | self-signed + verify-full | ca.crt or require |

## Success criteria

- [ ] `SHOW ssl` = on
- [ ] Connection `sslmode=require` OK
- [ ] verify-full plan in K8s documented
- [ ] Understanding hostssl vs host

## Next

RLS: [10-rls-audit.md](10-rls-audit.md).
