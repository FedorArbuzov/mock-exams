# 10. Troubleshooting and audit

## Intro: "Who read the production DB password?"

Without an **audit device** the answer is "unknown". With an audit log you can see: `token` → `path` → `operation` → `response` (status). After a root-token leak the team must **revoke**, **rotate**, and **trace** the chain — not just "changed the password in Slack".

## What you'll learn

- Common API and CLI errors.
- The **audit log** format and storage.
- Responding to a **token compromise**.
- Link to [linux-security/07-secrets-disk](../linux-security/07-secrets-disk.md) and host-level forensics.

---

## Diagnostics: the first screen

```bash
vault status
export VAULT_ADDR VAULT_TOKEN   # check both
vault token lookup
vault auth -methods
```

| Symptom | Common cause |
|---------|----------------|
| `connection refused` | Vault down, wrong port, TLS mismatch |
| `permission denied` | policy, expired token, wrong namespace |
| `sealed` | needs an unseal ([09](09-ha-raft-unseal.md)) |
| `no handler for route` | engine not enabled — `init-engines.sh` |
| `path is already in use` | a re-enable — not an error |
| `invalid role name` | a typo in `pki/issue/ROLE` |

On the sandbox: [`deploy/vault/README.md`](../../deploy/vault/README.md#troubleshooting).

---

## Logging levels

```bash
vault audit list
vault audit enable file file_path=/vault/logs/audit.log
```

| Device | Purpose |
|--------|------------|
| `file` | Lab / VM |
| `socket` | SIEM agent |
| `syslog` | Central collection |

**Requirement:** in some configurations an audit device **can't** be disabled without a restart; when the disk is full, Vault may **block** requests (fail closed) — plan for log rotation.

Example record (simplified):

```json
{
  "type": "response",
  "auth": { "token_type": "service", "policies": ["ci-read"] },
  "request": { "operation": "read", "path": "secret/data/course/ci-demo" },
  "response": { "status": 200 }
}
```

**At the interview:** by default the audit doesn't log secret **values** in HMAC mode for sensitive paths — check `log_raw` (dangerous).

---

## Token incidents

### Suspected service-token leak

1. `vault token lookup <token>` — policies, ttl, accessor
2. `vault token revoke <token>` or `vault token revoke -accessor`
3. Check the **child** tokens: `vault list auth/token/accessors`
4. Rotate the **static** secrets accessible to that policy
5. Root cause: CI log? `.env` in git? ([07-secrets-disk](../linux-security/07-secrets-disk.md))

### Root compromise

1. Seal (if possible) / isolate the network
2. Generate a new root ([recovery procedure](https://developer.hashicorp.com/vault/docs/concepts/dev-server) — in prod, operator generate-root)
3. Revoke all old accessors
4. Review policies, enable MFA for human auth
5. Post-mortem + audit timeline

---

## Policy debugging

```bash
vault token capabilities <token> secret/data/course/ci-demo
vault policy read ci-read
```

Use the **path spec** precisely: KV v2 data path `secret/data/...`, metadata `secret/metadata/...`.

---

## PKI / Transit specifics

| Problem | Check |
|----------|----------|
| cert not trusted | chain, intermediate missing |
| `domain not allowed` | role `allowed_domains` |
| decrypt fail after rotate | `min_decryption_version` |
| high latency | many small encrypts → batching / local ciphertext cache |

---

## Performance (briefly)

- **Connection pooling** to Vault from the application.
- An **agent sidecar** — cache the lease, reduce API load.
- Don't call Vault on **every HTTP request** — cache the token / use short-lived app encryption keys.

---

## Compliance checklist

- [ ] Audit on all nodes
- [ ] Immutable storage (S3 Object Lock, WORM)
- [ ] Retention ≥ company policy
- [ ] Alert on `root` login, `sudo` policy change
- [ ] Regular **break-glass** drill

---

## Summary

- Troubleshooting starts with `status`, `token lookup`, capabilities.
- The audit is the foundation of **forensics** and compliance.
- Next step: [11. Lab: incident response](11-lab-incident-response.md).
