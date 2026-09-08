# 05. Lab: first Application

## Goal

Point Argo CD at **`apps/hello`** in your public Git repo and sync a Deployment into **`lab-argocd`**.

## Prerequisites

- Argo CD from [03-lab-install.md](03-lab-install.md)  
- `apps/hello` **pushed** to your public repo ([ENVIRONMENT.md](ENVIRONMENT.md))  
- `GITOPS_REPO` set to that HTTPS URL  

## Task 1. Confirm Git

On GitHub/GitLab, open `apps/hello/app.yaml`. If it is missing, copy from [examples/apps/hello](examples/apps/hello/app.yaml) and `git push`.

## Task 2. Apply the Application CR

From the mock-exams checkout (or a copy of the file):

```bash
export GITOPS_REPO=https://github.com/YOUR_USER/gitops-lab.git   # your URL

sed "s|YOUR_GITOPS_REPO|$GITOPS_REPO|" \
  courses-en/kuber-argocd/examples/argocd/application-hello.yaml \
  | kubectl apply -f -
```

PowerShell:

```powershell
$repo = "https://github.com/YOUR_USER/gitops-lab.git"
(Get-Content courses-en\kuber-argocd\examples\argocd\application-hello.yaml) `
  -replace "YOUR_GITOPS_REPO", $repo | kubectl apply -f -
```

## Task 3. Wait for sync

```bash
kubectl -n argocd get application hello
# SYNCED / HEALTHY (may take a minute)

kubectl -n argocd annotate application hello \
  argocd.argoproj.io/refresh=hard --overwrite

kubectl -n lab-argocd get deploy,svc,pods
```

In the UI, open **hello** — tree should show Deployment + Service.

## Task 4. Optional: curl

```bash
kubectl -n lab-argocd port-forward svc/hello 18080:80
# http://127.0.0.1:18080  — nginx default page
```

## Success criteria

- [ ] Application `hello` exists in `argocd`  
- [ ] Namespace `lab-argocd` exists  
- [ ] Deployment `hello` Ready  
- [ ] Interactive Check passes  

## If it fails

| Symptom | Try |
|---------|-----|
| ComparisonError | URL must be **HTTPS**, repo **public**, path `apps/hello` |
| Empty dest namespace | Wait; click **Sync**; check `CreateNamespace=true` |
| Application missing | `kubectl apply` the CR into namespace **`argocd`** |
| Still `YOUR_GITOPS_REPO` | placeholder was not replaced |

Leave `hello` installed — [07](07-lab-self-heal.md) uses it.

Next: [06. Sync vs Health](06-sync-drift.md).
