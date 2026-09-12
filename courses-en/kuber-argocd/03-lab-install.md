# 03. Lab: install Argo CD

## Goal

Install Argo CD into namespace **`argocd`** with Helm and open the UI.

## Prerequisites

- [ENVIRONMENT.md](ENVIRONMENT.md) — Docker Desktop Ready, Helm 3  
- GitHub/GitLab account (you create the gitops repo in [lesson 05](05-lab-first-app.md), not now)

Paste **one command per line**. PowerShell does not treat `\` as a line break.

## Task 1. Helm repo

```powershell
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
```

## Task 2. Install (lean values)

Dex and notifications are off to save RAM. `server.insecure` lets you port-forward over **HTTP**.

```powershell
helm upgrade --install argocd argo/argo-cd --namespace argocd --create-namespace --set dex.enabled=false --set notifications.enabled=false --set configs.params."server.insecure"=true
```

```powershell
kubectl -n argocd get pods -w
```

Wait until `server`, `repo-server`, `application-controller`, `redis`, `applicationset-controller` are Ready. Then Ctrl+C.

## Task 3. Password and UI

```powershell
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String((kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}")))
```

```powershell
kubectl -n argocd port-forward svc/argocd-server 8080:80
```

Open **http://127.0.0.1:8080** — user **`admin`**, password from the command above. Use `127.0.0.1`, not `localhost`.

## Task 4. Smoke

```powershell
kubectl -n argocd get deploy
kubectl get crd | findstr argoproj
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
