# 04. Application CR: source, destination, syncPolicy

## Minimal Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: hello-gitops-direct
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR/mock-exams.git
    targetRevision: master
    path: deploy/gitops/manifests/hello-gitops
  destination:
    server: https://kubernetes.default.svc
    namespace: gitops-demo
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

## source fields

| Field | Purpose |
|-------|---------|
| `repoURL` | HTTPS or SSH Git |
| `targetRevision` | branch, tag, commit SHA |
| `path` | directory with YAML or a chart |
| `helm` / `kustomize` | render parameters |

Argo CD does **not** read local files from your laptop — only what’s in the **remote** (exceptions: private repo + credentials).

## destination

| Field | Value on mockctl |
|-------|------------------|
| `server` | `https://kubernetes.default.svc` — in-cluster |
| `namespace` | where Deployment/Service land |

## syncPolicy

| Option | Effect |
|--------|--------|
| `automated` | sync when Git changes |
| `selfHeal: true` | undo a manual `kubectl edit` |
| `prune: true` | delete resources removed from Git |
| `CreateNamespace=true` | create the NS on first sync |

## Project (brief)

`project: default` — no restrictions. In enterprise — AppProject with repo/namespace/cluster whitelist.

Template in the repo: [`examples/application-hello.yaml`](../../deploy/gitops/examples/application-hello.yaml).

## Checklist

- Why is the Application in namespace `argocd`, while the Pod is in `gitops-demo`?
- What happens if `targetRevision` points at a non-existent branch?
- Why `CreateNamespace=true`?

Lab: [05-lab-first-application.md](05-lab-first-application.md).
