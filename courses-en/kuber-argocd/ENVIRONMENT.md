# Environment for Kubernetes Argo CD

This course uses **Docker Desktop Kubernetes**, the **courses UI**, **Argo CD in-cluster**, and a **public Git repository** you own. Argo CD does not read files from your laptop — only from Git over HTTPS.

## One-time setup

### A. Courses UI + Kubernetes

Follow [QUICKSTART.md](../../QUICKSTART.md):

1. Docker Desktop with **Kubernetes** enabled  
2. Courses one-liner → http://127.0.0.1:8091/  
3. `kubectl config use-context docker-desktop`

Give Docker **at least 6 GB RAM**.

```bash
kubectl get nodes
# Ready
```

### B. Helm 3

```bash
helm version
```

### C. Public Git repo (you create it in lesson 05)

Do **not** copy files from this course repo. In [05-lab-first-app.md](05-lab-first-app.md) you:

1. Create `~/gitops-lab` and write `apps/hello/app.yaml` yourself  
2. Push it to an empty **public** GitHub/GitLab repository  
3. Apply the Application CR from `~/kuber-argocd/` (that YAML stays **off** Git)

Argo CD clones **HTTPS**. Keep the repo public so you do not need a token.

Later labs add paths in the **same** repo:

```text
apps/hello/          # you write in lesson 05 (also 07, 13)
charts/shop/         # you write in lesson 09 (also 11, 14)
apps/shop-vault/     # optional lesson 15 — annotations only, no password
apps/shop-eso/       # optional lesson 16 — ExternalSecret, no password
```

```bash
export GITOPS_REPO=https://github.com/YOUR_USER/gitops-lab.git
```

**Refresh after every push:** Argo polls on an interval (often ~3 min). In the UI click **Refresh**, or:

```bash
kubectl -n argocd annotate application hello \
  argocd.argoproj.io/refresh=hard --overwrite
```

### D. Install Argo CD (lesson 03)

```bash
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

helm upgrade --install argocd argo/argo-cd \
  --namespace argocd --create-namespace \
  --set dex.enabled=false \
  --set notifications.enabled=false \
  --set configs.params."server.insecure"=true
```

Wait until pods are Ready:

```bash
kubectl -n argocd get pods
```

Admin password:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d
echo
```

PowerShell:

```powershell
[Text.Encoding]::UTF8.GetString([Convert]::FromBase64String(
  (kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}")
))
```

UI (HTTP, because `server.insecure=true`):

```bash
kubectl -n argocd port-forward svc/argocd-server 8080:80
# http://127.0.0.1:8080  user: admin
```

Prefer **`127.0.0.1`** over `localhost` on Windows.

Optional CLI: install `argocd` from [Argo CD releases](https://github.com/argoproj/argo-cd/releases). `kubectl get application -n argocd` is enough for the course.

## Working directory

```bash
mkdir -p ~/kuber-argocd && cd ~/kuber-argocd
```

Application CRs (`hello.yaml`, …) live here. Workloads live in **`~/gitops-lab`** and on Git, not in this folder.

| Namespace | Role |
|-----------|------|
| `argocd` | Argo CD + Application / ApplicationSet CRs |
| `lab-argocd` | First app (lessons 05–07) |
| `lab-argocd-helm` | Helm lab |
| `lab-argocd-staging` / `lab-argocd-prod` | ApplicationSet lab |
| `lab-argocd-fix` | Troubleshooting lab |
| `lab-argocd-final` | Final project |
| `vault` / `lab-argocd-vault` | Optional lesson 15 (Vault + injected app) |
| `external-secrets` / `lab-argocd-eso` | Optional lesson 16 (ESO + synced Secret) |

## Interactive Check

| Object | Example |
|--------|---------|
| Namespace, Deployment | apps synced from Git |
| Application / ApplicationSet | CRs in `argocd` |

Sync timing, UI Diff, and Git auth are **not** auto-graded.

## Optional: local GitLab

If you already run the [gitlab-cicd](../gitlab-cicd/ENVIRONMENT.md) one-liner, you can push `gitops-lab` there instead. Register the project in Argo CD (**Settings → Repositories**) with a deploy token if the project is private. Public GitHub is simpler for this course.

## Uninstall (end of course)

```powershell
kubectl -n argocd delete applicationset,application,appproject --all
helm uninstall argocd -n argocd
helm uninstall vault -n vault
helm uninstall external-secrets -n external-secrets
kubectl delete namespace argocd vault external-secrets lab-argocd lab-argocd-helm lab-argocd-staging lab-argocd-prod lab-argocd-fix lab-argocd-final lab-argocd-vault lab-argocd-eso --ignore-not-found
```

## Sanity checklist

- [ ] `kubectl get nodes` → Ready  
- [ ] Pods Running in `argocd`  
- [ ] UI login as `admin` works  
- [ ] After lesson 05: public `GITOPS_REPO` has `apps/hello/app.yaml` you wrote  
- [ ] http://127.0.0.1:8091/ → courses  

## Related

- Older mockctl stand: [deploy/gitops](../../deploy/gitops/README.md)  
- Overview: [kuber-advanced/16-argocd.md](../kuber-advanced/16-argocd.md)  
