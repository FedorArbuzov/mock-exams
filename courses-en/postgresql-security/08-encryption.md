# 08. Encryption

## Real-world scenario

Pen-test: app→DB traffic in plain text inside the VPC ("we trust the network"). Separately — a stolen EBS snapshot without encryption — the full PGDATA is readable. Compliance requires **in transit** and **at rest** — different mechanisms, both mandatory.

PostgreSQL community edition does **not** have native TDE (transparent data encryption) like Oracle/SQL Server — at rest = **disk / cloud / backup**, not `CREATE TABLE ... ENCRYPTED`.

## What you'll learn

- TLS for clients (`sslmode`)
- Encryption at rest: disk, backup, column
- `pgcrypto` — when it's appropriate
- RDS / managed patterns

## In transit (TLS)

Server:

```ini
ssl = on
ssl_cert_file = 'server.crt'
ssl_key_file = 'server.key'
ssl_min_protocol_version = 'TLSv1.2'
```

pg_hba:

```text
hostssl  all  all  10.0.0.0/8  scram-sha-256
```

Client — `sslmode` levels:

| sslmode | Verification | When |
|---------|----------|-------|
| `disable` | No TLS | **Never** prod |
| `require` | TLS, no cert check | Better than disable |
| `verify-ca` | CA trusted | Staging |
| `verify-full` | CA + hostname match | **Production** |

```bash
psql "postgresql://app@db:5432/course?sslmode=verify-full&sslrootcert=/certs/ca.crt"
```

TLS encrypts **all** query/response data after the handshake. SCRAM protects only the password during auth — it **does not replace TLS**.

See the lab [09-lab-ssl](09-lab-ssl.md), [`examples/ssl/README.md`](examples/ssl/README.md).

## At rest — levels

```text
Column (pgcrypto)     ← rarely, keys in Vault
    ↑
Application encrypt   ← before writing to PG
    ↑
PostgreSQL PGDATA     ← files on disk
    ↑
Block storage         ← LUKS, EBS encrypted, encrypted PVC
    ↑
Backups (S3)          ← SSE-KMS, IAM
```

| Level | Implementation | Who manages it |
|---------|------------|---------------|
| Disk | LUKS, EBS encryption, CMEK | Cloud / OS team |
| PVC (K8s) | StorageClass encrypted | Platform |
| Backup | S3 SSE-KMS, cross-account deny public | DBA + Security |
| Column | `pgp_sym_encrypt` | App + Vault |

## pgcrypto (column-level)

```sql
CREATE EXTENSION pgcrypto;

INSERT INTO sec.secrets (payload)
VALUES (pgp_sym_encrypt('PAN-4111...', current_setting('app.encrypt_key')));

SELECT pgp_sym_decrypt(payload::bytea, 'key') FROM sec.secrets;
```

Downsides:

- The key in `current_setting` — a leak via logs
- No index on plaintext
- Key rotation is hard

Preferred: encrypt in the app ([secrets-basic](../secrets-basic/README.md)) or tokenization (PCI).

## RDS / managed

| Service | At rest | In transit |
|--------|---------|------------|
| AWS RDS | Enable at create (can't later) | `rds-ca-2019-root.pem`, `verify-full` |
| Aurora | Same | Same |
| Cloud SQL | Google-managed keys | SSL required |

See [aws-intermediate](../aws-intermediate/README.md).

## verify-full in K8s

```yaml
volumeMounts:
  - name: db-ca
    mountPath: /etc/ssl/certs/db-ca.crt
    subPath: ca.crt
env:
  - name: DATABASE_URL
    value: "...?sslmode=verify-full&sslrootcert=/etc/ssl/certs/db-ca.crt"
```

The CA Secret — from the platform team; rotation without downtime with a dual-CA.

## Common mistakes

1. `sslmode=require` without cert verification — MITM is possible.
2. EBS encryption off "for performance" — a snapshot = breach.
3. Backup bucket without SSE — a copy of PGDATA in clear.
4. pgcrypto with a key in a SQL migration in git.
5. "VPC is private" = no TLS needed — defense in depth.

## Checklist

- [ ] hostssl + verify-full in the prod target
- [ ] At rest: disk + backup encrypted
- [ ] CA rotation process
- [ ] pgcrypto only with a key from Vault
- [ ] RDS encryption at create

## Next

SSL lab: [09-lab-ssl.md](09-lab-ssl.md).
