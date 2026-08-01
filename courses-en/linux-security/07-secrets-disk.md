# 07. Secrets on disk

## Where secrets leak

| Place | Example |
|-------|--------|
| `.env` in git | API_KEY=... |
| `/tmp` world-readable | a token dump |
| backups | pg_dump with passwords |
| swap | keys from memory on disk |
| history | `export TOKEN=...` |

## File permissions

```bash
umask 077
install -m 600 -o app app /etc/myapp/secret.env
find /etc/myapp -type f -perm /o+r -ls
```

| Permissions | Who can read |
|-------|------------|
| 644 | all users on the system |
| 600 | the owner only |
| 640 | owner + group |

## /tmp and /dev/shm

Mounting in `/etc/fstab`:

```text
tmpfs /tmp tmpfs defaults,noexec,nosuid,nodev,size=2G 0 0
```

- `noexec` — you can't run a binary from /tmp
- `nosuid` — ignore setuid
- `nodev` — no device files

## Memory and swap

For sensitive hosts:

- encrypted swap or `swapoff`;
- **mlock** for secrets in applications (rare in the lab).

## Vault and secret managers

Secrets are **not** in the repository:

- HashiCorp Vault, OpenBao — courses [secrets-basic](../secrets-basic/README.md) / [advanced](../secrets-advanced/README.md), stand [`deploy/vault`](../../deploy/vault/README.md);
- AWS Secrets Manager ([`aws-intermediate/11-secrets-kms`](../aws-intermediate/11-secrets-kms.md));
- GitLab CI variables (masked) — [gitlab-basic/07](../gitlab-basic/07-variables-secrets.md).

The application receives the secret at startup via an agent/sidecar.

## git-secrets

A pre-commit hook — block commits containing `AKIA`, private keys.

## Checklist

- How do you find world-readable files in /etc?
- Why noexec on /tmp?
- Where do you store the DB password in K8s? (preview: a Secret)

Next lesson: [08. Lab: secret permissions](08-lab-tmp.md).
