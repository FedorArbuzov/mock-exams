# 13. Capstone: internal PKI + Transit + CI identity

## Project goal (4–6 hours)

Assemble a **documented** mini secrets platform on the [`deploy/vault`](../../deploy/vault/README.md) sandbox: an internal CA, encryption of a PII field via Transit, CI access via AppRole **without root**, an incident runbook, and an answer to a design question — an artifact for your portfolio and interviews.

## Prerequisites

Chapters **01–12** completed, or the equivalent of [secrets-basic](../secrets-basic/README.md) + this README.

```bash
cd deploy/vault
docker compose up -d
bash scripts/init-engines.sh
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
```

---

## Part A — PKI platform (90 min)

1. Issue a cert for `cap.lab.mock-exams.local` ([02-lab](02-lab-pki-issue-cert.md)) — save the PEM in `examples/capstone/` (locally, **not** in git).
2. Fill out [`examples/rotation-checklist.md`](examples/rotation-checklist.md) for this cert.
3. Simulate a rotation: a second issue + revoke of the first lease ([04-lab](04-lab-cert-rotation.md)).
4. Document `examples/capstone/pki-design.md` (1 page):
   - root vs intermediate (even if the sandbox has a single level)
   - leaf TTL and alerts
   - issue vs sign — your choice for the "product"

**Deliverable:** `pki-design.md` + a completed checklist.

---

## Part B — Transit for PII (60 min)

1. Key `capstone-pii`, encrypt the JSON `{"email":"user@example.com"}`.
2. Rotate + rewrap ([06-lab](06-lab-transit.md)).
3. In `examples/capstone/transit-notes.md` describe:
   - where the ciphertext is stored (the `users.encrypted_email` column)
   - who has an encrypt-only policy vs decrypt
   - a comparison with [aws-intermediate/11-secrets-kms](../aws-intermediate/11-secrets-kms.md) in 1 paragraph

**Deliverable:** `transit-notes.md` + a sample ciphertext (may be redacted).

---

## Part C — CI identity (60 min)

1. Policy `capstone-ci`: read `secret/data/course/capstone/*`, **no** access to `pki/issue`, `transit/decrypt`.
2. AppRole `capstone-deploy` + login without root.
3. Put a secret: `vault kv put secret/course/capstone/config api_key=demo`.
4. Verify the deny on `vault write pki/issue/lab-server ...` with the CI token.

**Deliverable:** the HCL policy in `examples/capstone/ci-policy.hcl` + 5 lines on "how to deliver the secret_id in GitLab" ([gitlab-basic/07](../gitlab-basic/07-variables-secrets.md)).

---

## Part D — Incident runbook (45 min)

Using the [11-lab](11-lab-incident-response.md) template, write `examples/capstone/incident-runbook.md`:

- a capstone CI token leak
- a root leak (theoretically)
- a reference to [linux-security/07-secrets-disk](../linux-security/07-secrets-disk.md)

**Deliverable:** a 1–2 page runbook.

---

## Part E — Mock design interview (30 min)

In writing, answer question **25** from [12-interview-qa](12-interview-qa.md): an mTLS mesh of 50 services.

Answer structure:

1. Trust model (internal CA)
2. Issuance automation (agent / cert-manager)
3. Rotation and blast radius
4. Observability (expiry metrics)
5. What you do **not** put in Vault (business data — keys/certs only)

**Deliverable:** `examples/capstone/design-mtls.md`.

---

## Success criteria (self-check)

| Area | Check |
|---------|----------|
| PKI | cert verify OK; checklist filled out |
| Transit | rotate/rewrap without losing decrypt |
| CI | root not needed; least privilege |
| Ops | runbook is usable |
| Interview | the design doc reads in 5 min |

---

## What to say at the interview

"I brought up a Vault dev sandbox, deployed PKI and Transit via init-engines, issued an mTLS cert with role constraints, encrypted a PII field via Transit with key rotation, wired CI through AppRole with a restricted policy, and wrote an incident runbook. I understand why dev mode doesn't carry over to prod: Raft, auto-unseal, audit."

---

## Next

- Go through [12-interview-qa](12-interview-qa.md) and [interview-cheatsheet](interview-cheatsheet.md) without prompts.
- [secrets-basic](../secrets-basic/README.md) — if you skipped the foundation.
- Production: the Vault Helm chart, a cert-manager issuer, the Terraform provider.
