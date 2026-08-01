# 12. Interview Q&A — top 25 questions with answers

Format: **question** → **short answer** (30 s) → **deep dive** (2–3 min). Table: [`interview-cheatsheet.md`](interview-cheatsheet.md).

---

## Vault architecture

### 1. Why Vault if Kubernetes Secrets exist?

**Short:** A K8s Secret is base64 in etcd; no dynamic rotation, audit, or centralized policies.

**Deep dive:** External Secrets / CSI + Vault; short-lived DB creds; etcd encryption at rest ≠ protection from an insider. See [kuber-basic Secret](../kuber-basic/12-config-and-secret.md).

### 2. What is a secrets engine?

**Short:** A mounted plugin (`kv/`, `pki/`, `transit/`) with an API and storage semantics.

**Deep dive:** An auth method ≠ an engine; path `secret/data/x` vs `pki/issue/role`.

### 3. KV v1 vs v2?

**Short:** v2 — versions, metadata, `destroy`, check-and-set.

**Deep dive:** Path `secret/data/` vs `secret/`; soft delete; [secrets-basic](../secrets-basic/README.md).

### 4. Dev mode dangers?

**Short:** In-memory, a known root, auto-unseal — lab only.

**Deep dive:** [09](09-ha-raft-unseal.md), [deploy/vault](../../deploy/vault/README.md).

### 5. Seal vs unseal?

**Short:** Sealed — storage is encrypted, the API is restricted; unseal restores the master key in RAM.

**Deep dive:** Shamir M-of-N; auto-unseal KMS; reboot → sealed without auto-unseal.

---

## PKI

### 6. Why the PKI engine and not openssl in CI?

**Short:** Policy, TTL, audit, CRL, a centralized CA.

**Deep dive:** [01](01-pki-overview.md); role `allowed_domains`; issue vs sign.

### 7. Issue vs sign?

**Short:** Issue — Vault generates the key; sign — the client brings a CSR, the key stays local.

**Deep dive:** PCI compliance — prefer sign; [02-lab](02-lab-pki-issue-cert.md).

### 8. How do you forbid a cert for someone else's domain?

**Short:** `allowed_domains`, no `allow_any_name`.

**Deep dive:** [`pki-role.json`](examples/pki-role.json); separate roles per team.

### 9. Leaf vs intermediate rotation?

**Short:** Leaf often (days); intermediate less often; root offline.

**Deep dive:** [03](03-rotation-renewal.md), dual chain, [rotation-checklist](examples/rotation-checklist.md).

### 10. What does a lease on a cert give you?

**Short:** Automatic TTL tracking; revoke via `vault lease revoke`.

**Deep dive:** CRL refresh; clients must check revocation.

---

## Transit and encryption

### 11. Transit vs storing the key in the application?

**Short:** KEK in Vault; the application keeps only ciphertext.

**Deep dive:** [05](05-transit-encryption.md); compare [AWS KMS](../aws-intermediate/11-secrets-kms.md).

### 12. What does `vault:v1:` in ciphertext mean?

**Short:** The Transit key version for decrypt/rewrap.

**Deep dive:** rotate + `min_encryption_version`; lazy rewrap ([06-lab](06-lab-transit.md)).

### 13. Do you need to re-encrypt the whole DB on rotate?

**Short:** Not immediately — `rewrap` or on read.

**Deep dive:** Batch rewrap job; downtime planning.

---

## Auth and dynamic secrets

### 14. When to use AppRole?

**Short:** CI/VMs without a K8s SA; role_id + secret_id.

**Deep dive:** [07](07-dynamic-secrets-approle.md), [08-lab](08-lab-approle.md); prefer K8s auth in a cluster.

### 15. How do you deliver a secret_id safely?

**Short:** Wrapping, agent, masked CI — not in git/log.

**Deep dive:** `secret_id_num_uses`, TTL; [11-lab](11-lab-incident-response.md).

### 16. Dynamic database secret flow?

**Short:** Vault creates a SQL user for a TTL, then drops it.

**Deep dive:** A connection pool to Vault; DB max connections; rotating the admin creds.

### 17. Root token in production?

**Short:** No routine use; revoke after init; break-glass only.

**Deep dive:** Generate root with quorum; audit alert.

---

## HA and ops

### 18. Raft quorum?

**Short:** A majority of nodes for a commit; usually 3 or 5 servers.

**Deep dive:** [09](09-ha-raft-unseal.md); losing 2 of 3 → write unavailability.

### 19. Auto-unseal trade-off?

**Short:** Convenient restart; a dependency on KMS/HSM.

**Deep dive:** Shamir backup; DR drill.

### 20. Is audit mandatory?

**Short:** Yes in prod for forensics and compliance.

**Deep dive:** [10](10-troubleshooting-audit.md); fail closed if the disk is full.

---

## Incident and comparisons

### 21. A service token leaked — the steps?

**Short:** Revoke → assess policy → rotate secrets → fix delivery → post-mortem.

**Deep dive:** [11-lab](11-lab-incident-response.md).

### 22. Vault vs AWS Secrets Manager?

**Short:** Vault — multi-cloud, PKI/Transit; ASM — native AWS, simpler for Lambda.

**Deep dive:** [11-secrets-kms](../aws-intermediate/11-secrets-kms.md); hybrid is common.

### 23. Where is a secret still risky after Vault?

**Short:** Process memory, a core dump, logs, `/tmp`, backups.

**Deep dive:** [07-secrets-disk](../linux-security/07-secrets-disk.md); agent templates 600.

### 24. Policy debugging?

**Short:** `vault token capabilities`; exact KV v2 paths.

**Deep dive:** Deny by default; test with a limited token.

### 25. Design: an mTLS mesh of 50 services?

**Short:** An internal Vault CA, short TTL, cert-manager/agent, trust bundle rotation.

**Deep dive:** [13-capstone](13-capstone.md); intermediate rotation; expiry monitoring.

---

## How to practice

1. Go through [`interview-cheatsheet.md`](interview-cheatsheet.md) out loud without prompts.
2. For each question, draw **one** diagram (PKI chain / Transit / AppRole login).
3. Tie the answer to a **personal lab** on `deploy/vault`.

Next step: [13. Capstone](13-capstone.md).
