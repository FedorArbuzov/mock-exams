# 13. Final project: checkout service secrets

## Intro: assemble basic into one loop

Separately you can do KV v2, policies, token TTL, CI tabletop, and the K8s auth concept. The **finale** is a **checkout service** scenario on [`deploy/vault`](../../deploy/vault/README.md): secret hierarchy `secret/course/checkout/*`, readonly policy for CI, deploy-fetch emulation, a **PROJECT.md** document, and a comparison with a GitLab-only approach.

## What you'll learn (course outcome)

- Design a **path layout** and policies.
- Issue **tokens** with different rights (app-read, ci-read, admin-write for dev).
- Describe a **runbook** for a leaked token and KV version rotation.
- Map to [12-comparison-managers](12-comparison-managers.md).

## Requirements

| # | Requirement | Criterion |
|---|------------|----------|
| 1 | Stand | `docker compose up -d`, `smoke.sh` OK |
| 2 | KV paths | `db`, `deploy`, `stripe` under `secret/course/checkout/` |
| 3 | Policies | `course-readonly` + `course-dev-writer` (dev prefix only) |
| 4 | Tokens | CI readonly + dev writer; TTL documented |
| 5 | CI tabletop | fetch `deploy` → json → jq without echoing the key |
| 6 | K8s tabletop | role JSON + SA diagram in PROJECT.md |
| 7 | Document | `PROJECT.md` per template |
| 8 | Comparison | 1 paragraph: GitLab masked only vs Vault |

---

## Domain scenario

**Checkout** — a microservice:

| Secret path | Keys (example) | Who reads |
|-------------|----------------|------------|
| `secret/course/checkout/db` | username, password, host | app runtime |
| `secret/course/checkout/deploy` | api_key, registry_user | GitLab CI |
| `secret/course/checkout/stripe` | webhook_secret | app runtime |
| `secret/course/dev/checkout/feature` | flag_key | dev writer only |

---

## Phase 1. Prepare the stand

```bash
cd deploy/vault
docker compose up -d
export VAULT_ADDR=http://localhost:8200 VAULT_TOKEN=course
bash scripts/smoke.sh
```

```bash
V="docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=course mock-vault vault"
```

---

## Phase 2. Secrets and versions

```bash
$V kv put secret/course/checkout/db \
  username=checkout_app password='ProdLike-NotReal' host=postgres.prod.lab

$V kv put secret/course/checkout/deploy \
  api_key='sk-final-deploy-key' registry_user=ci-checkout env=production

$V kv put secret/course/checkout/stripe webhook_secret='whsec_lab_only'

$V kv put secret/course/dev/checkout/feature flag_key=beta-checkout-v2
```

Rotation tabletop: update **only** `deploy` (version 2); keep version 1 via `kv get -version=1`.

---

## Phase 3. Policies

### 3.1 Readonly (from repo)

```bash
docker exec -i -e VAULT_TOKEN=course mock-vault vault policy write course-readonly - \
  < deploy/vault/examples/policy-readonly.hcl
```

Extension: CI must not read `stripe` — in PROJECT.md describe a **separate** policy `ci-deploy-only` (create it yourself) with path only `secret/data/course/checkout/deploy`.

### 3.2 Dev writer (create it)

Example contents of `course-dev-writer.hcl`:

```hcl
path "secret/data/course/dev/*" {
  capabilities = ["create", "read", "update", "delete", "list"]
}
path "secret/metadata/course/dev/*" {
  capabilities = ["list", "read", "delete"]
}
```

```bash
# write the file locally and:
docker exec -i -e VAULT_TOKEN=course mock-vault vault policy write course-dev-writer - < course-dev-writer.hcl
```

---

## Phase 4. Tokens

```bash
$V token create -policy=course-readonly -ttl=30m -display-name=final-ci
$V token create -policy=course-dev-writer -ttl=2h -display-name=final-dev
```

Checks:

- CI token: `kv get deploy` OK, `kv put deploy` denied.
- Dev token: `kv put secret/course/dev/checkout/feature flag_key=v3` OK.
- Dev token: `kv get secret/course/checkout/db` denied (if policy is only the dev prefix).

---

## Phase 5. CI tabletop

Repeat [09-lab-ci](09-lab-ci.md) with production-like values; attach in PROJECT.md:

- artifact size (without key contents);
- `jq` command to verify `env=production`;
- `vault token revoke -self` at the end.

Snippet link: [`examples/gitlab-vault-snippet.yml`](examples/gitlab-vault-snippet.yml).

---

## Phase 6. Kubernetes tabletop

In PROJECT.md:

1. Diagram: namespace `checkout`, SA `checkout-app`.
2. Mapping table to [`examples/k8s-auth-role.json`](examples/k8s-auth-role.json).
3. Which secrets the Pod mounts (db, stripe) — **not** the deploy key.

---

## Phase 7. Runbook (template)

In `PROJECT.md` section **Runbook: leaked CI token**:

1. **Symptom:** unknown `kv get` in audit / suspicious pipeline.
2. **Immediately:** `vault token revoke <accessor>`.
3. **Rotate:** `kv put` deploy version N+1; invalidate the old api_key at the registry.
4. **Root cause:** variable scope, protected branch, OIDC migration plan.
5. **Escalation:** list accessors `vault list auth/token/accessors`.

---

## PROJECT.md template

```markdown
# Secrets Basic — Final Project

## Author / date

## Stand
- deploy/vault, mock-vault
- VAULT_ADDR, token course (lab only)

## Path layout
- secret/course/checkout/…
- secret/course/dev/…

## Policies
- course-readonly (paths)
- course-dev-writer (paths)
- ci-deploy-only (if you created it)

## Tokens
| name | policies | ttl | checks |

## Rotation
- deploy v1 → v2, commands

## CI tabletop
- fetch artifact, jq, revoke

## K8s auth
- SA, role bindings, diagram

## Runbook
- leaked CI token

## Comparison
- GitLab masked only vs Vault (1 paragraph)

## Conclusions
- 3 bullets
```

---

## Grading criteria (self-check)

- [ ] Three prod-like checkout secrets + dev feature secret
- [ ] Policies loaded; dev writer does not write to `checkout/` prod paths
- [ ] CI and dev tokens verified with negative tests
- [ ] Deploy secret rotated (2 versions)
- [ ] PROJECT.md complete without pasting real “prod” passwords into a public fork
- [ ] Link to [`deploy/vault/README.md`](../../deploy/vault/README.md)

## Next

- [`secrets-advanced`](../secrets-advanced/README.md) — PKI, Transit, dynamic DB
- [gitlab-advanced/07-oidc-cloud](../gitlab-advanced/07-oidc-cloud.md) — JWT auth
- [aws-intermediate/11](../aws-intermediate/11-secrets-kms.md) — SM + KMS
- [kuber-basic/12](../kuber-basic/12-config-and-secret.md) — ConfigMap vs Secret

Congratulations on completing **Secrets — Basic**.
