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

### C. Public Git repo (required)

Create an empty **public** GitHub or GitLab repository, for example `gitops-lab`. Clone it and copy the course examples into the **repo root**:

```bash
# from the mock-exams checkout
cp -r courses-en/kuber-argocd/examples/apps ./gitops-lab/
cp -r courses-en/kuber-argocd/examples/charts ./gitops-lab/
cd gitops-lab
git add apps charts
git commit -m "lab: hello app + shop chart"
git push
```

PowerShell (from the mock-exams checkout):

```powershell
Copy-Item -Recurse courses-en\kuber-argocd\examples\apps gitops-lab\
Copy-Item -Recurse courses-en\kuber-argocd\examples\charts gitops-lab\
```

Repo layout Argo will see:

```text
apps/hello/          # plain YAML (lessons 05, 07, 13)
charts/shop/         # Helm chart (lessons 09, 11, 14)
```

Set your HTTPS URL (no credentials — keep the repo public):

```bash
export GITOPS_REPO=https://github.com/YOUR_USER/gitops-lab.git
```

You will paste this URL into Application YAMLs under [examples/argocd/](examples/argocd/) (`YOUR_GITOPS_REPO`).

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

Keep Application CRs here (copied from `examples/argocd/`). Workloads belong in Git, not in this folder.

| Namespace | Role |
|-----------|------|
| `argocd` | Argo CD + Application / ApplicationSet CRs |
| `lab-argocd` | First app (lessons 05–07) |
| `lab-argocd-helm` | Helm lab |
| `lab-argocd-staging` / `lab-argocd-prod` | ApplicationSet lab |
| `lab-argocd-fix` | Troubleshooting lab |
| `lab-argocd-final` | Final project |

## Interactive Check

| Object | Example |
|--------|---------|
| Namespace, Deployment | apps synced from Git |
| Application / ApplicationSet | CRs in `argocd` |

Sync timing, UI Diff, and Git auth are **not** auto-graded.

## Optional: local GitLab

If you already run the [gitlab-cicd](../gitlab-cicd/ENVIRONMENT.md) one-liner, you can push `gitops-lab` there instead. Register the project in Argo CD (**Settings → Repositories**) with a deploy token if the project is private. Public GitHub is simpler for this course.

## Uninstall (end of course)

```bash
kubectl -n argocd delete applicationset,application,appproject --all
helm uninstall argocd -n argocd
kubectl delete namespace argocd lab-argocd lab-argocd-helm \
  lab-argocd-staging lab-argocd-prod lab-argocd-fix lab-argocd-final \
  --ignore-not-found
# CRDs may remain — optional: kubectl get crd | grep argoproj.io
```

## Sanity checklist

- [ ] `kubectl get nodes` → Ready  
- [ ] Pods Running in `argocd`  
- [ ] UI login as `admin` works  
- [ ] Public `GITOPS_REPO` has `apps/hello` and `charts/shop`  
- [ ] http://127.0.0.1:8091/ → courses  

## Related

- Older mockctl stand: [deploy/gitops](../../deploy/gitops/README.md)  
- Overview: [kuber-advanced/16-argocd.md](../kuber-advanced/16-argocd.md)  
