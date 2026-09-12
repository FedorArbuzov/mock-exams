# 05. Lab: first Application

## Goal

You create a **public Git repo**, write a Deployment there, then apply an Application CR so Argo CD syncs it into **`lab-argocd`**.

Argo never reads files off your laptop. If it is not on Git over HTTPS, it does not exist.

## Prerequisites

- Argo CD from [03-lab-install.md](03-lab-install.md), UI login works  
- A GitHub or GitLab account  
- `git` on PATH  

You do **not** need the `mock-exams` tree or `examples/`.

## Task 1. Folder and workload YAML

Create a directory that will become the Git repo. Keep Application CRs **out** of it (task 4).

PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path "$HOME\gitops-lab\apps\hello" | Out-Null
Set-Location "$HOME\gitops-lab"
```

bash:

```bash
mkdir -p ~/gitops-lab/apps/hello
cd ~/gitops-lab
```

Create **`apps/hello/app.yaml`** (editor or Cursor) with **exactly** this — names must stay `hello` for Interactive Check:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello
  labels:
    app: hello
spec:
  replicas: 1
  selector:
    matchLabels:
      app: hello
  template:
    metadata:
      labels:
        app: hello
    spec:
      containers:
        - name: web
          image: nginx:1.27-alpine
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 2
            periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: hello
  labels:
    app: hello
spec:
  selector:
    app: hello
  ports:
    - name: http
      port: 80
      targetPort: 80
```

Do **not** `kubectl apply` this file. Git is the source; Argo will apply it.

## Task 2. Empty public repo on the host

In the GitHub/GitLab UI create a new repository named **`gitops-lab`**:

- **Public** (Argo clones without a token)  
- **No** README, **no** `.gitignore`, **no** license — empty  

Copy the HTTPS URL, for example `https://github.com/YOU/gitops-lab.git`.

## Task 3. First commit and push

Still in `~/gitops-lab`:

```bash
git init
git add apps
git commit -m "lab: hello Deployment and Service"
git branch -M main
git remote add origin https://github.com/YOU/gitops-lab.git
git push -u origin main
```

Replace `YOU` with your user. If `git commit` refuses, set `user.name` / `user.email` once.

On the website you should see `apps/hello/app.yaml`.

## Task 4. Application CR (local, not in Git)

The chicken-and-egg object lives next to the cluster, not in `gitops-lab`.

```powershell
New-Item -ItemType Directory -Force -Path "$HOME\kuber-argocd" | Out-Null
```

```bash
mkdir -p ~/kuber-argocd
```

Create **`~/kuber-argocd/hello.yaml`**. Paste **your** HTTPS URL into `repoURL` (the whole string, including `.git`):

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: hello
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOU/gitops-lab.git
    targetRevision: HEAD
    path: apps/hello
  destination:
    server: https://kubernetes.default.svc
    namespace: lab-argocd
  syncPolicy:
    automated:
      prune: false
      selfHeal: false
    syncOptions:
      - CreateNamespace=true
```

```bash
kubectl apply -f ~/kuber-argocd/hello.yaml
```

PowerShell: `kubectl apply -f $HOME\kuber-argocd\hello.yaml`

## Task 5. Wait for sync

```bash
kubectl -n argocd get application hello
# SYNCED / HEALTHY (may take a minute)
```

If it sits on Unknown / OutOfSync, hard-refresh:

```bash
kubectl -n argocd annotate application hello \
  argocd.argoproj.io/refresh=hard --overwrite
```

PowerShell — same flags, one line (no `\`):

```powershell
kubectl -n argocd annotate application hello argocd.argoproj.io/refresh=hard --overwrite
```

```bash
kubectl -n lab-argocd get deploy,svc,pods
```

UI → **hello** — tree shows Deployment + Service.

## Task 6. Optional: curl

```bash
kubectl -n lab-argocd port-forward svc/hello 18080:80
```

http://127.0.0.1:18080 — nginx default page.

## Success criteria

- [ ] Public repo contains `apps/hello/app.yaml` (you wrote it)  
- [ ] Application `hello` exists in `argocd`  
- [ ] Namespace `lab-argocd` exists  
- [ ] Deployment `hello` Ready  
- [ ] Interactive Check passes  

## If it fails

| Symptom | Try |
|---------|-----|
| ComparisonError | URL **HTTPS**, repo **public**, path exactly `apps/hello` |
| `authentication required` | repo is private — make it public or add a repo credential in the UI |
| Empty dest namespace | Wait; UI **Sync**; `CreateNamespace=true` on the CR |
| Application missing | `kubectl apply` into namespace **`argocd`** (`metadata.namespace`) |
| `no matches for kind Application` | lesson 03 did not finish — CRD missing |
| Still `YOU/gitops-lab` | you did not replace the URL |

Leave `hello` installed — [07](07-lab-self-heal.md) uses the same Git path.

Next: [06. Sync vs Health](06-sync-drift.md).
