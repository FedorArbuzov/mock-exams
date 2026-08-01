# 04. Secrets and credentials

## Intro

Leaking **one** token into Git is a classic incident: access to the registry, cloud account, prod DB. DevSecOps is responsible for **where they are stored**, **how they get into runtime**, and **how they are rotated** — not for choosing the password `Password123`.

---

## Classes of secrets

| Type | Examples | TTL |
|-----|---------|-----|
| Human | SSH key, console password | months + MFA |
| Machine long-lived | API key in `.env` | **avoid** |
| Machine short-lived | OIDC → STS, Vault lease | minutes–hours |
| Bootstrap | Vault unseal (Shamir) | ceremony |

**Rule:** in prod, prefer **short-lived** + **audience-scoped** (a role for deploy only, not admin).

---

## Antipatterns

| Where | Problem |
|-----|----------|
| Git / MR diff | secret detection should block it |
| Dockerfile `ENV KEY=...` | a layer in the registry forever |
| K8s Secret base64 | not encryption; RBAC + etcd encryption |
| CI variables "masked" but in the log | echo in the script |
| Terraform state | plaintext secrets in S3 without encryption |
| Slack / ticket | "here's the kubeconfig" |

---

## Lifecycle

```text
Create → Distribute → Use → Rotate → Revoke
```

| Stage | Practice |
|------|----------|
| Create | Vault / cloud SM / sealed secrets |
| Distribute | CSI driver, Agent sidecar, External Secrets |
| Use | file mount, not env (debatable; env is easier to leak via `/proc`) |
| Rotate | automated + dual-read window |
| Revoke | on offboarding, compromise, end of project |

Related: [secrets-basic](../secrets-basic/README.md), [secrets-advanced](../secrets-advanced/README.md).

---

## GitLab / CI

| Mechanism | Why |
|----------|--------|
| Masked + protected variables | protected branch only |
| OIDC to cloud | without static AWS keys |
| Separate env scopes | staging ≠ prod |

Related: [gitlab-basic/07](../gitlab-basic/07-variables-secrets.md), [aws-intermediate/21](../aws-intermediate/21-security-ci.md).

---

## Kubernetes

| Object | Risk |
|--------|------|
| Secret in the default NS | anyone with `get secrets` |
| SA token auto-mount | extra credentials in the pod |
| etcd without encryption | snapshot = all secrets |

Controls: namespace isolation, [RBAC](../kuber-intermediate/09-rbac.md), [PSA Restricted](../kuber-advanced/18-pod-security.md), External Secrets Operator.

---

## Detecting leaks

- **gitleaks / GitLab secret detection** on every push.
- **TruffleHog** on the history when onboarding a repo.
- **Rotate** all keys if a secret ends up in a public fork — even if you "deleted the commit".

---

## In mock-exams

| Practice | Course |
|----------|------|
| Vault KV + policies | [secrets-basic](../secrets-basic/README.md) |
| K8s Secret vs Vault | [secrets-basic/12](../secrets-basic/12-comparison-managers.md) |
| KMS | [aws-intermediate/11](../aws-intermediate/11-secrets-kms.md) |

---

## Summary

Secrets are **data with a lifecycle**, not a string in values.yaml. The goal is a **short TTL**, a **minimal blast radius**, and **automatic detection** in git and CI.

---

## Checklist

- [ ] Are there long-lived cloud keys in CI?
- [ ] Are registry credentials rotated?
- [ ] Does secret detection block the merge?

**Next:** [05. Containers](05-container-security.md).
