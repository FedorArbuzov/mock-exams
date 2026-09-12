# Kubernetes Vault

Hands-on course: **HashiCorp Vault inside Kubernetes** — Helm install, **Kubernetes auth**, **Vault Agent Injector**, policies and KV paths — on **Docker Desktop Kubernetes**.

**Time:** ~10–14 hours + **3–4 hours** final project.  
**Prerequisites:** [`kuber-basic`](../kuber-basic/README.md) (especially Secrets / ServiceAccounts). Helpful: [`secrets-basic`](../secrets-basic/README.md) (KV + policies on Docker Compose) or a short Vault UI tour.

> This is **not** a full Vault-from-zero course. For seal/engines/ACL on Compose, see [`secrets-basic`](../secrets-basic/README.md). Here the focus is **how Pods get secrets from Vault in a cluster**.

Setup: **[ENVIRONMENT.md](ENVIRONMENT.md)** · UI: **http://127.0.0.1:8091/kuber-vault/README.md**

---

## How to take this course

1. **Read** the theory page.
2. **Do** the lab — Helm, `vault` CLI (via `kubectl exec`), YAML annotations.
3. **Check** — **Interactive Check** when `*.lab.json` exists (namespaces, SA, Deployments, annotations). Vault UI / inject file contents you verify yourself.

---

## Local stand

| Component | How | Note |
|-----------|-----|------|
| Courses UI | QUICKSTART | http://127.0.0.1:8091/ |
| Kubernetes | Docker Desktop | `docker-desktop` |
| Vault | Helm `hashicorp/vault` **dev** mode | namespace `vault` |
| Injector | enabled with the chart | mutates Pods with annotations |
| Vault UI / API | port-forward | http://127.0.0.1:8200 — token `root` (dev only) |

**RAM:** **4+ GB** free for Docker. Dev mode = data in memory (fine for labs, not production).

---

## Curriculum

### Foundations (01–03)

1. [Why Vault in Kubernetes](01-why-vault-k8s.md)
2. [Vault Helm chart and Agent Injector](02-vault-helm.md)
3. [Lab: install Vault](03-lab-install.md)

### Secrets and policy (04–05)

4. [KV v2 paths and policies for apps](04-kv-and-policy.md)
5. [Lab: write secrets and a readonly policy](05-lab-kv-policy.md)

### Kubernetes auth (06–07)

6. [Kubernetes auth and TokenReview](06-kubernetes-auth.md)
7. [Lab: enable auth and bind a role](07-lab-k8s-auth.md)

### Injector (08–09)

8. [Agent Injector annotations](08-agent-injector.md)
9. [Lab: inject a secret into a Pod](09-lab-inject.md)

### Patterns and ops (10–13)

10. [Injector vs External Secrets vs CSI](10-delivery-patterns.md)
11. [Lab: compare inject vs plain K8s Secret](11-lab-compare.md)
12. [Troubleshooting login and inject](12-troubleshooting.md)
13. [Lab: fix a broken role / annotation](13-lab-troubleshooting.md)

### Capstone

14. [Final project: checkout secrets](14-final-project.md)

---

## What you should end up with

- Install Vault (dev) + Injector with Helm on Docker Desktop.
- Store app secrets in KV v2 and lock them with a Vault policy.
- Configure **Kubernetes auth** bound to a ServiceAccount + namespace.
- Annotate a Deployment so the Agent injects files under `/vault/secrets`.
- Explain when to use Injector vs syncing into a Kubernetes Secret.
- Debug denied login and missing inject sidecars.

## Related

| Course | Relation |
|--------|----------|
| [secrets-basic](../secrets-basic/README.md) | Vault KV/policy on Compose; K8s chapters are tabletop |
| [secrets-advanced](../secrets-advanced/README.md) | PKI, Transit, AppRole, HA |
| [kuber-basic/12](../kuber-basic/12-config-and-secret.md) | native Secret / ConfigMap |
| [kuber-monitoring](../kuber-monitoring/README.md) | same Docker Desktop + Helm style |
