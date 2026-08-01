# Secrets — Basic (HashiCorp Vault)

Introductory level: **why a secrets manager**, **Vault architecture**, **KV v2**, **ACL policies**, **auth methods and token TTLs**, **GitLab CI + Vault**, **Kubernetes auth (concept)**, **comparison with AWS SM / GitLab masked / env**, **mini-project “checkout service secrets”**.

**Prerequisites:** Linux and Docker ([`linux-basic`](../linux-basic/README.md) — `docker compose`, `export`, terminal). Helpful: [gitlab-basic/07](../gitlab-basic/07-variables-secrets.md), [kuber-basic/12](../kuber-basic/12-config-and-secret.md), [aws-intermediate/11](../aws-intermediate/11-secrets-kms.md).

**Locally:** [`deploy/vault`](../../deploy/vault/README.md) — `docker compose up -d`, from the host:

| Parameter | Value |
|----------|----------|
| API / UI | [http://localhost:8200](http://localhost:8200) · UI: `/ui` |
| Root token (lab only) | `course` |
| Container | `mock-vault` |

```bash
export VAULT_ADDR=http://localhost:8200
export VAULT_TOKEN=course
# or without a local vault CLI:
docker exec -e VAULT_TOKEN=course mock-vault vault status
```

Smoke: `bash scripts/smoke.sh` in `deploy/vault`. Snippets: [`examples/gitlab-vault-snippet.yml`](examples/gitlab-vault-snippet.yml), [`examples/k8s-auth-role.json`](examples/k8s-auth-role.json).

**Next:** [`secrets-advanced`](../secrets-advanced/README.md) (PKI, Transit, dynamic DB). Related: [gitlab-advanced/07-oidc-cloud](../gitlab-advanced/07-oidc-cloud.md), [kafka-intermediate/19](../kafka-intermediate/19-security-basics.md).

## How to read the chapters

Each lesson is a **book chapter**, not a cheat sheet. Recommended order within each pair:

1. Read the **theory** (01, 02, 04…) — do not skip “common mistakes”.
2. Open the **lab** (03, 05…) with the stand running (`docker compose up -d` in `deploy/vault`).
3. Complete tasks **in order**; compare output with the “what you’ll see” block.
4. If the API does not respond — [`deploy/vault/README.md`](../../deploy/vault/README.md) (healthcheck, `VAULT_TOKEN`, dev mode).

**Theory structure:** intro (workplace scenario) → what you’ll learn → concepts → stand example → mistakes → in production → summary → checklist.

**Lab structure:** goal → prerequisites → tasks 1…N (why / commands / what you’ll see) → success criteria.

**Time:** about **40–50 minutes** per “theory + lab” pair; [final project](13-final-project.md) — **2–3 hours**.

**Connection cheat sheet:**

| From | Address / command |
|--------|-----------------|
| API from host | `VAULT_ADDR=http://localhost:8200` |
| Token (lab) | `VAULT_TOKEN=course` |
| UI login | Method **Token**, value `course` |
| CLI in container | `docker exec -e VAULT_TOKEN=course mock-vault vault …` |
| KV mount (after smoke) | `secret/` (engine **kv-v2**) |

## Curriculum

### Fundamentals (01–03)

1. [Why secrets: static vs dynamic, ecosystem](01-why-secrets.md)
2. [Vault architecture: seal, engines, paths](02-vault-architecture.md)
3. [Lab: KV v2 — put, get, versions](03-lab-kv-v2.md)

### Policies (04–05)

4. [ACL policies: path, capabilities](04-policies-acl.md) · 5. [Lab: readonly policy](05-lab-policies.md)

### Auth (06–07)

6. [Auth methods: token, AppRole, K8s (overview)](06-auth-methods.md) · 7. [Lab: token, TTL, revoke](07-lab-token-ttl.md)

### CI (08–09)

8. [GitLab CI and Vault: variables, KV for deploy](08-ci-gitlab-vault.md) · 9. [Lab: tabletop CI + secret](09-lab-ci.md)

### Kubernetes (10–11)

10. [Vault and Kubernetes: Secret vs Vault, auth](10-kubernetes-vault.md) · 11. [Lab: K8s auth (tabletop + mockctl)](11-lab-k8s-auth.md)

### Comparison and finale (12–13)

12. [Comparing secrets managers](12-comparison-managers.md)
13. [Final project: checkout service secrets](13-final-project.md)

## What you should end up with

- Explain **static vs dynamic** secrets and when you need Vault.
- Work with **KV v2** (`secret/data/…`, metadata, versions).
- Write **least-privilege** policies and verify them under a limited token.
- Understand **auth methods**, **token TTL**, and **revoke**.
- Describe the **GitLab CI → Vault KV → deploy secret** flow (tabletop).
- Explain **Kubernetes auth** and how it relates to [kuber-basic/12](../kuber-basic/12-config-and-secret.md).
- Compare Vault with **AWS Secrets Manager**, **GitLab masked**, and **`.env` in a repo**.

## Examples

| Path | Purpose |
|------|------------|
| [`examples/gitlab-vault-snippet.yml`](examples/gitlab-vault-snippet.yml) | `.gitlab-ci.yml` fragment + Vault KV |
| [`examples/k8s-auth-role.json`](examples/k8s-auth-role.json) | Kubernetes auth role (reference) |
| [`deploy/vault/examples/policy-readonly.hcl`](../../deploy/vault/examples/policy-readonly.hcl) | policy for lab 05 |
