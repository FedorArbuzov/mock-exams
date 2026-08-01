# HashiCorp Vault — Advanced

Advanced level for **interviews** and **production-minded** practice: **PKI** (internal CA, certificate issuance), **rotation and renewal**, **Transit** (encryption-as-a-service), **dynamic secrets** and **AppRole**, **HA / Raft / unseal** (theory), **audit** and **incident response**, **mock interview**, and **capstone**.

**Prerequisites:** [`secrets-basic`](../secrets-basic/README.md) — KV v2, policies, tokens, first contact with the Vault CLI and UI.

**Locally:** [`deploy/vault`](../../deploy/vault/README.md)

| Step | Command |
|-----|---------|
| Bring up Vault (dev mode) | `cd deploy/vault && docker compose up -d` |
| **Required for this course** | `bash scripts/init-engines.sh` — KV, **PKI**, **Transit** |
| Variables | `export VAULT_ADDR=http://localhost:8200` · `VAULT_TOKEN=course` |

> **Dev mode:** root token `course`, data in memory, automatic unseal. This is enough for PKI/Transit; **seal/unseal** and **Raft** behavior is covered theoretically in [09](09-ha-raft-unseal.md).

Before the labs, make sure `init-engines.sh` ran without errors (a re-run producing `path is already in use` is normal).

## How to read the chapters

Each lesson is a **book chapter** for interview prep, not a dry cheatsheet.

1. **Theory** (01, 03, 05…) — a real-world scenario → concepts → commands on the sandbox → common mistakes → "at the interview" → summary.
2. **Lab** (02, 04, 06…) — goal → prerequisites → tasks → "what you'll see" / "if it doesn't work" → success criteria.
3. After the PKI + Transit + AppRole blocks — go through [`interview-cheatsheet.md`](interview-cheatsheet.md) without peeking at the answers.

**Time:** ~60–90 minutes per "theory + lab" pair; the [capstone](13-capstone.md) — **4–6 hours**.

## Curriculum

### PKI and certificates (01–04)

| # | Lesson |
|---|------|
| 01 | [PKI: overview and trust model](01-pki-overview.md) |
| 02 | [Lab: issuing a certificate](02-lab-pki-issue-cert.md) |
| 03 | [Rotation, renewal, CRL](03-rotation-renewal.md) |
| 04 | [Lab: certificate rotation](04-lab-cert-rotation.md) |

### Transit and encryption (05–06)

| 05 | [Transit: encryption-as-a-service](05-transit-encryption.md) |
| 06 | [Lab: Transit encrypt/decrypt](06-lab-transit.md) |

### Dynamic secrets (07–08)

| 07 | [Dynamic secrets and AppRole](07-dynamic-secrets-approle.md) |
| 08 | [Lab: AppRole for CI](08-lab-approle.md) |

### HA and operations (09–11)

| 09 | [HA, Raft, unseal](09-ha-raft-unseal.md) *(theory, no full HA lab)* |
| 10 | [Troubleshooting and audit](10-troubleshooting-audit.md) |
| 11 | [Lab: incident response](11-lab-incident-response.md) |

### Interview and wrap-up (12–13)

| 12 | [Interview Q&A (top 25)](12-interview-qa.md) |
| 13 | [Capstone](13-capstone.md) |

### Cheatsheet and examples

| — | [Interview cheatsheet](interview-cheatsheet.md) |
| — | [examples/pki-role.json](examples/pki-role.json) |
| — | [examples/rotation-checklist.md](examples/rotation-checklist.md) |

## What you should end up with

- You can explain the **PKI engine**, the **root → intermediate → leaf** chain, **TTL**, **role**, **allowed_domains**.
- You issue a certificate on the sandbox and verify the **SAN**, the **chain**, and the **validity period**.
- You plan **rotation** of the CA and leaf without downtime (conceptually + checklist).
- You use **Transit** to encrypt data **without storing plaintext** in Vault.
- You configure **AppRole** with **secret_id** delivery and a **least-privilege policy**.
- You distinguish **dev mode** from **Raft + Shamir / auto-unseal** in production.
- You read the **audit log** and respond to a **leaked token** / **policy drift**.
- You answer the interviewer's typical questions ([12](12-interview-qa.md)).

## Related courses

| Course | Relation |
|------|-------|
| [`secrets-basic`](../secrets-basic/README.md) | KV, policies, tokens — the foundation |
| [`aws-intermediate/11-secrets-kms`](../aws-intermediate/11-secrets-kms.md) | AWS Secrets Manager + KMS; comparison with Vault |
| [`aws-intermediate/12-lab-secrets-kms`](../aws-intermediate/12-lab-secrets-kms.md) | secrets without a password in tfvars |
| [`linux-security/07-secrets-disk`](../linux-security/07-secrets-disk.md) | secrets on disk, umask, /tmp — why the Vault agent beats `.env` |
| [`gitlab-basic/07-variables-secrets`](../gitlab-basic/07-variables-secrets.md) | masked variables vs Vault for CI |
| [`kuber-basic/12-config-and-secret`](../kuber-basic/12-config-and-secret.md) | K8s Secret vs external secrets operator + Vault |

## Security (important)

The sandbox is **forbidden in production**: a fixed root token, no audit hardening, no TLS on the API. In production: **TLS**, **Raft**, **auto-unseal**, **namespaces** (Enterprise), an **audit device** on immutable storage, **periodic tokens**, **break-glass** procedures.
