# 08. Lab: AppRole for CI

## Lab goal

Enable **AppRole**, issue a token with a restricted policy (reading KV), and simulate a **CI job** without the root token `course`.

## Prerequisites

- [07. Dynamic secrets and AppRole](07-dynamic-secrets-approle.md)
- [secrets-basic](../secrets-basic/README.md) — KV `secret/` (if you did it; otherwise create the path below)

```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
vault secrets enable -path=secret kv-v2 2>/dev/null || true
vault kv put secret/course/ci-demo value="deploy-ok"
```

---

## Task 1. A policy for the CI path only

```hcl
# /tmp/vault-approle-lab/ci-read.hcl
path "secret/data/course/ci-demo" {
  capabilities = ["read"]
}
```

```bash
vault policy write ci-read /tmp/vault-approle-lab/ci-read.hcl
```

---

## Task 2. AppRole

```bash
vault auth enable approle 2>/dev/null || true

vault write auth/approle/role/ci-lab \
  token_policies="ci-read" \
  token_ttl=10m \
  token_max_ttl=30m \
  secret_id_ttl=5m \
  secret_id_num_uses=2

ROLE_ID=$(vault read -field=role_id auth/approle/role/ci-lab/role-id)
SECRET_ID=$(vault write -field=secret_id -f auth/approle/role/ci-lab/secret-id)

echo "ROLE_ID=$ROLE_ID"
echo "SECRET_ID=$SECRET_ID (do not commit)"
```

---

## Task 3. Login as CI

```bash
CI_TOKEN=$(vault write -field=token auth/approle/login \
  role_id="$ROLE_ID" \
  secret_id="$SECRET_ID")

VAULT_TOKEN=$CI_TOKEN vault kv get secret/course/ci-demo
VAULT_TOKEN=$CI_TOKEN vault kv put secret/course/forbidden hack=1
```

**Expected:** get OK, put **permission denied**.

```bash
VAULT_TOKEN=$CI_TOKEN vault token lookup
```

---

## Task 4. Response wrapping (optional)

```bash
WRAPPED=$(vault write -field=wrapping_token -wrap-ttl=60s \
  -f auth/approle/role/ci-lab/secret-id)

vault unwrap "$WRAPPED"
```

**Why:** the secret_id doesn't show up in the CI log directly — the unwrap is one-time.

---

## Task 5. Exhausting the secret_id

Repeat the login twice with the **same** secret_id (given `secret_id_num_uses=2`):

```bash
vault write auth/approle/login role_id="$ROLE_ID" secret_id="$SECRET_ID"
vault write auth/approle/login role_id="$ROLE_ID" secret_id="$SECRET_ID"
vault write auth/approle/login role_id="$ROLE_ID" secret_id="$SECRET_ID"
```

**Expected:** the third call — a uses-exceeded error. Explain how CI should **request a new** secret_id for each job.

---

## Comparison with GitLab variables

In the README notes: why a **masked GitLab variable** ([07-variables-secrets](../gitlab-basic/07-variables-secrets.md)) is weaker than AppRole + Vault for **rotation** and **audit**.

---

## Success criteria

- [ ] The CI token reads only `secret/course/ci-demo`
- [ ] Root isn't needed for the job
- [ ] You understand role_id vs secret_id
- [ ] (optional) wrapping or the uses limit demonstrated

Next lesson: [09. HA, Raft, unseal](09-ha-raft-unseal.md).
