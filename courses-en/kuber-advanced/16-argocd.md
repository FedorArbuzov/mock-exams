# 16. Argo CD: deploy from git

> Deeper track: [gitops-basic](../gitops-basic/README.md) → [gitops-intermediate](../gitops-intermediate/README.md), bench [`deploy/gitops`](../../deploy/gitops/README.md) on mockctl.

## GitOps in a nutshell

The **desired state** of the cluster is stored in Git. A controller (Argo CD) compares Git with the cluster and **synchronizes** them:

```text
Git repo (manifests/helm)
        │
        ▼
   Argo CD Application
        │
        ▼
   Kubernetes cluster
```

Benefits: auditability, rollback via git revert, a single source of truth.

## Argo CD components

| Component | Role |
|---|---|
| `argocd-server` | UI + API |
| `application-controller` | Synchronization |
| `repo-server` | Cloning git, helm template |
| `redis` | Cache |

## Installation

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=available deploy/argocd-server -n argocd --timeout=300s
```

UI:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# https://localhost:8080  user: admin
# password:
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
```

CLI:

```bash
brew install argocd   # or download the binary
argocd login localhost:8080 --username admin --password <pwd> --insecure
```

## Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: mock-exams
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/FedorArbuzov/mock-exams.git
    targetRevision: master
    path: deploy/demo          # directory with manifests
  destination:
    server: https://kubernetes.default.svc
    namespace: demo
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

| Field | Meaning |
|---|---|
| `automated` | Synchronize on git change |
| `prune` | Delete from the cluster what's not in git |
| `selfHeal` | Revert manual `kubectl edit` |
| `CreateNamespace=true` | Create the namespace if it doesn't exist |

## Sync modes

- **Manual** — the Sync button in the UI / `argocd app sync`.
- **Auto** — on push to git.

## Helm source

```yaml
source:
  repoURL: https://github.com/...
  path: charts/myapp
  helm:
    valueFiles:
      - values-prod.yaml
```

## Useful commands

```bash
argocd app list
argocd app get mock-exams
argocd app sync mock-exams
argocd app diff mock-exams
kubectl get applications -n argocd
```

## Checklist

- What is selfHeal?
- How does Argo CD differ from `kubectl apply` in CI?
- Where is the desired state stored?
- What does `prune` do?

Lab: [17-lab-argocd.md](17-lab-argocd.md) — a short lab; the full course — [gitops-basic/05](../gitops-basic/05-lab-first-application.md).
