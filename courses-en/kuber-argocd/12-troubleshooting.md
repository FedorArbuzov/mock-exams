# 12. Troubleshooting Argo CD

## Decision tree

```text
Application red / stuck
    │
    ├─ ComparisonError / unknown revision ──► Git URL, credentials, branch, path
    ├─ OutOfSync forever ──► selfHeal off? kubectl fighting CI? ignoreDifferences
    ├─ Synced + Degraded ──► Pods, image, probes (not Argo)
    ├─ Sync failed ──► kubectl apply error: RBAC, quota, invalid YAML, CRD missing
    └─ Deleting stuck ──► Application finalizer; resources still in dest NS
```

## Toolkit

| Command | Use |
|---------|-----|
| `kubectl -n argocd get applications` | sync/health columns |
| `kubectl -n argocd describe application NAME` | events, conditions |
| UI **App details → Diff / History** | field-level drift |
| `kubectl -n argocd logs deploy/argocd-repo-server` | clone / helm template |
| `kubectl -n argocd logs statefulset/argocd-application-controller` | sync |
| annotate `argocd.argoproj.io/refresh=hard` | force Git fetch |

```bash
kubectl -n argocd get applications
kubectl -n argocd get application hello -o yaml
# status.sync.status  status.health.status  status.conditions
```

## Common failures

### ComparisonError / `repository not found`

- Typo in `repoURL` or `path`  
- Private repo without **Settings → Repositories** credentials  
- Default branch is `main` but you pinned `master` (or the reverse)  
- Repo is empty / never pushed `apps/hello`

### `helm template` fails

- Missing `valueFiles` path (must be under `source.path`)  
- Chart API / required value empty  

### Sync failed, Kubernetes rejects

- Destination namespace missing and no `CreateNamespace=true`  
- AppProject forbids that namespace or repo  
- Resource exists with a different field manager (`kubectl apply` vs Argo)

### Healthy but you see old image

- Argo synced **Git**; Git still has the old tag. **Bump Git**, don’t `kubectl set image`.  
- Auto-sync off — click Sync.

### Application stuck in Deleting

```bash
kubectl -n argocd patch application hello --type merge \
  -p '{"metadata":{"finalizers":null}}'
```

Last resort — may leave workloads behind; delete the dest namespace if it is a lab.

## Upgrade note

Helm chart and CLI should stay on the same **stable** line. After chart upgrade, wait for controller Ready, then `kubectl -n argocd get applications`.

## Checklist

- [ ] First object to `describe` when the UI is red?  
- [ ] ComparisonError vs Sync failed — which is Git vs kube-apiserver?  
- [ ] How do you force a Git refresh without waiting for the poll?  

Next lab: [13. Lab: fix a broken Application](13-lab-troubleshooting.md).
