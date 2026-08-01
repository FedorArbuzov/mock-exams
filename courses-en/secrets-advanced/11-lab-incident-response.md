# 11. Lab: incident response (simulation)

## Lab goal

Simulate a **CI token leak** with the `ci-read` policy: revoke the token, trace its capabilities, and document the runbook steps. We do **not** enable an audit device on the dev sandbox (it requires a restart and paths inside the container) — we analyze a **conceptual** log and the commands you'd run in prod.

## Prerequisites

- [10. Troubleshooting and audit](10-troubleshooting-audit.md)
- [08-lab-approle](08-lab-approle.md) completed (policy `ci-read`, AppRole `ci-lab`)

```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
```

---

## Scenario

"A job's `VAULT_TOKEN` was accidentally printed into the GitLab CI log. The token had the `ci-read` policy. Suspicion: an attacker could have read `secret/course/ci-demo` and attempted escalation."

---

## Task 1. Reproduce the "leak"

Create a new CI token (as in lab 08):

```bash
ROLE_ID=$(vault read -field=role_id auth/approle/role/ci-lab/role-id)
SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/ci-lab/secret-id)
LEAKED=$(vault write -field=token auth/approle/login role_id="$ROLE_ID" secret_id="$SECRET_ID")
echo "LEAKED=$LEAKED"
```

Save it to `/tmp/vault-ir-lab/leaked-token.txt` (simulating it landing in a log).

---

## Task 2. Assess the blast radius

```bash
vault token lookup "$LEAKED"
vault token capabilities "$LEAKED" secret/data/course/ci-demo
vault token capabilities "$LEAKED" sys/auth/approle
vault token capabilities "$LEAKED" pki/issue/lab-server
```

Fill in the table:

| Path | allow? |
|------|--------|
| `secret/data/course/ci-demo` | |
| `sys/auth/approle` | |
| `pki/issue/lab-server` | |

**Criterion:** you understand that PKI **cannot** be issued without a separate policy.

---

## Task 3. Containment

```bash
vault token revoke "$LEAKED"
vault token lookup "$LEAKED"
```

**Expected:** a lookup error / revoked.

Revoke all active secret_ids (optional):

```bash
vault write auth/approle/role/ci-lab/secret-id-accessor/destroy secret_id_accessor=$(vault write -field=secret_id_accessor -f auth/approle/role/ci-lab/secret-id)
```

(If the accessor is unavailable — generate a new `secret_id` and make sure the old one has exhausted its uses.)

---

## Task 4. Runbook (in writing)

Create `/tmp/vault-ir-lab/runbook.md` (5–10 steps):

1. Confirm leak scope (token lookup)
2. Revoke token / accessor
3. Rotate affected secrets (what do you change in `secret/course/ci-demo`?)
4. Review audit (in prod: a SIEM query by accessor)
5. Fix CI (masked → OIDC → Vault AppRole + wrapping)
6. Post-mortem

Reference [linux-security/07-secrets-disk](../linux-security/07-secrets-disk.md): why the token must not end up in an artifact.

---

## Task 5. Hardening (optional)

- Reduce the `ci-lab` role's `token_ttl` to `5m`.
- Add `token_bound_cidrs` (if you know the runner's IP).
- Compare with [aws-intermediate/12-lab-secrets-kms](../aws-intermediate/12-lab-secrets-kms.md): rotating a secret in AWS after an incident.

---

## Success criteria

- [ ] The token is revoked, lookup shows revoked
- [ ] The capabilities table is filled in
- [ ] The runbook is ready for the interview ("tell me about a Vault incident")
- [ ] Two measures to prevent a recurrence are named

Next lesson: [12. Interview Q&A](12-interview-qa.md).
