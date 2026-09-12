# Environment for Kubernetes Vault

This course uses **Docker Desktop Kubernetes**, the **courses UI**, and the Helm chart **hashicorp/vault** (dev server + Agent Injector). You do **not** need Compose [`deploy/vault`](../../deploy/vault/README.md) or the `mockctl` CLI — Vault runs **in the cluster**.

## One-time setup

### A. Courses UI + Kubernetes

Follow [QUICKSTART.md](../../QUICKSTART.md):

1. Docker Desktop with **Kubernetes** enabled  
2. Courses one-liner → http://127.0.0.1:8091/  
3. `kubectl config use-context docker-desktop`

Give Docker **at least 4 GB RAM**.

### B. Helm 3

```bash
helm version
# install: brew / winget / get-helm-3 — see kuber-monitoring ENVIRONMENT
```

### C. Install Vault (lesson 03)

Release name **`vault`**, namespace **`vault`**. Dev mode root token is **`root`** (lab only).

```bash
helm repo add hashicorp https://helm.releases.hashicorp.com
helm repo update

helm upgrade --install vault hashicorp/vault \
  --namespace vault --create-namespace \
  --set "server.dev.enabled=true" \
  --set "server.dev.devRootToken=root" \
  --set "injector.enabled=true" \
  --set "csi.enabled=false"
```

Wait:

```bash
kubectl -n vault get pods
# vault-0  Running / Ready
# vault-agent-injector-…  Running
```

### D. Talk to Vault

Port-forward API/UI:

```bash
kubectl -n vault port-forward svc/vault 8200:8200
# http://127.0.0.1:8200/ui  — token: root
```

CLI without installing Vault on the host:

```bash
kubectl -n vault exec -it vault-0 -- vault status
# VAULT_TOKEN is already set inside the dev container
```

From the host (if you installed the Vault CLI):

```bash
export VAULT_ADDR=http://127.0.0.1:8200
export VAULT_TOKEN=root
vault status
```

## Working directory

```bash
mkdir -p ~/kuber-vault && cd ~/kuber-vault
```

App labs use namespaces such as `lab-vault`, `checkout`. Leave namespace `vault` until the course ends.

## Interactive Check

Checks cover Kubernetes objects (namespaces, ServiceAccounts, Deployments, injector annotations). They do **not** call the Vault HTTP API yet — confirm `vault kv get` / injected files yourself.

## Uninstall

```bash
helm uninstall vault -n vault
kubectl delete namespace vault
# also delete lab namespaces: lab-vault, checkout, lab-vault-final
```

## Sanity checklist

- [ ] `kubectl get nodes` → Ready  
- [ ] `helm list -n vault` → `vault`  
- [ ] `kubectl -n vault get pods` → vault-0 + injector Ready  
- [ ] UI or `vault status` works via port-forward / exec  
- [ ] http://127.0.0.1:8091/ → courses  

## Related

- Compose-only Vault (optional warm-up): [`deploy/vault`](../../deploy/vault/README.md)  
- Full secrets theory: [`secrets-basic`](../secrets-basic/README.md)  
