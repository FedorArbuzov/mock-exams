# 03. Lab: install Argo CD

## Goal

Install Argo CD into namespace **`argocd`** with Helm and open the UI.

## Prerequisites

- [ENVIRONMENT.md](ENVIRONMENT.md) — Docker Desktop Ready, Helm 3  
- Public gitops repo prepared (you will use it from lesson 05)

## Task 1. Helm repo

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
```

## Task 2. Install (lean values)

Dex and notifications are off to save RAM. `server.insecure` lets you port-forward over **HTTP**.

```bash
helm upgrade --install argocd argo/argo-cd \
  --namespace argocd --create-namespace \
  --set dex.enabled=false \
  --set notifications.enabled=false \
  --set configs.params."server.insecure"=true
```

```bash
kubectl -n argocd get pods -w
# server, repo-server, application-controller, redis, applicationset-controller Ready
# Ctrl+C
```

## Task 3. Password and UI

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
echo
```

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:80
```

Open **http://127.0.0.1:8080** — user **`admin`**, password from the secret. Use `127.0.0.1` on Windows.

## Task 4. Smoke

```bash
kubectl -n argocd get deploy
kubectl -n argocd get crd | grep argoproj.io
```

You should see `applications.argoproj.io` and `applicationsets.argoproj.io`.

## Success criteria

- [ ] Namespace `argocd` exists  
- [ ] `argocd-server` Deployment Ready  
- [ ] UI login works  
- [ ] Interactive Check passes  

## If install fails

| Symptom | Try |
|---------|-----|
| Pods Pending | Raise Docker RAM; `kubectl -n argocd describe pod` |
| `server.insecure` ignored | Chart key is `configs.params.server.insecure` — re-run Helm with the `--set` from Task 2 |
| HTTPS / certificate warning | You should be on **http://** port **80** of the Service |
| `argocd-initial-admin-secret` missing | Wait for server Ready; Helm post-install Job creates it |

Do **not** uninstall — later labs need this release.

Next: [04. Application CR](04-application-cr.md).
