# 05. Transit: encryption-as-a-service

## Intro: "The encryption key sat right next to the ciphertext"

The team encrypted PII in PostgreSQL with a key from a **configmap**. The DB backup + the configmap leaked together — the data decrypted offline. **Transit** separates the roles: the application sees **ciphertext**, the master key stays in Vault, and a **key version** rotation doesn't require re-encrypting the whole DB at once (re-wrap).

## What you'll learn

- The **encryption-as-a-service** (EaaS) model.
- `transit/` paths: keys, encrypt, decrypt, rewrap.
- **Key versioning**, `min_decryption_version`, `min_encryption_version`.
- Convergent encryption and HMAC (overview).
- Comparison with [AWS KMS](../aws-intermediate/11-secrets-kms.md).

---

## Why Transit if KMS exists

| | Transit | AWS KMS |
|---|---------|---------|
| Deployment | Vault cluster | Managed AWS |
| Ciphertext format | `vault:v1:...` prefix | AWS SDK blob |
| Multi-cloud | Yes | AWS-centric |
| Policy | Vault ACL | IAM |

Both give an **envelope**: a data key / DEK is encrypted by a KEK in an HSM/software. Transit is convenient when secrets are already centralized in Vault ([secrets-basic](../secrets-basic/README.md)).

---

## Enabling (sandbox)

`init-engines.sh` runs:

```bash
vault secrets enable transit
```

Creating a named key:

```bash
vault write -f transit/keys/course-app type=aes256-gcm96
vault read transit/keys/course-app
```

| Parameter | Meaning |
|----------|--------|
| `type` | `aes256-gcm96`, `chacha20-poly1305`, `rsa-2048`, … |
| `derived` | Context-dependent key (convergent) |
| `exportable` | **false** in prod — forbid exporting key material |
| `allow_plaintext_backup` | **false** in prod |

---

## Encrypt / decrypt

```bash
vault write transit/encrypt/course-app plaintext=$(echo -n 'user:42:email' | base64)

vault write transit/decrypt/course-app ciphertext=vault:v1:...
```

**Plaintext** in the API is base64. The `ciphertext` response starts with `vault:v1:` — the key version is embedded.

The application (pseudocode):

```python
# Store only the ciphertext in the DB
ct = vault.secrets.transit.encrypt(name="course-app", plaintext=b"...")
pt = vault.secrets.transit.decrypt(name="course-app", ciphertext=ct["ciphertext"])
```

Vault does **not** store your business data — only the keys and audit records of operations.

---

## Key rotation

```bash
vault write -f transit/keys/course-app/rotate
vault write transit/keys/course-app/config min_encryption_version=2
```

| Operation | Effect |
|----------|--------|
| `rotate` | A new **latest** version; old ciphertext still decrypts |
| `rewrap` | Re-encrypt ciphertext to the new version without decrypting in the app |
| `min_encryption_version` | New encrypts only v2+ |

**At the interview:** "Do you need to re-read the whole DB on rotate?" — not immediately: lazy **rewrap** on read or a batch job.

---

## Sign / verify (overview)

Transit can also do **signing** (separate from PKI X.509):

```bash
vault write transit/keys/sign-key type=ed25519
vault write transit/sign/sign-key input=$(echo -n 'payload' | base64)
```

PKI is for TLS/mTLS; Transit sign is for **payload integrity** (JWT-like, webhook).

---

## Least-privilege policy

```hcl
path "transit/encrypt/course-app" {
  capabilities = ["update"]
}
path "transit/decrypt/course-app" {
  capabilities = ["update"]
}
# No access to export key material
```

An encrypt-only role for the writer service; decrypt — for the reader only. See also [`deploy/vault/examples/policy-readonly.hcl`](../../deploy/vault/examples/policy-readonly.hcl) for KV.

---

## Anti-patterns

| Bad | Better |
|-------|-------|
| `exportable=true` without reason | Keys never leave Vault |
| One transit key for the whole company | Key per app / tenant |
| Decrypt in the browser | Decrypt only on the backend |
| Storing plaintext in the audit | The audit logs the **request**, not the payload (configurable) |

---

## Summary

- Transit = **KEK in Vault**, ciphertext with you.
- Rotate + rewrap — without a Big Bang migration.
- Next step: [06. Lab: Transit](06-lab-transit.md).
