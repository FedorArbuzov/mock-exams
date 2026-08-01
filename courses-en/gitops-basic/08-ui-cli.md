# 08. UI, CLI, diff, and health

## UI (after port-forward)

| Section | Purpose |
|---------|---------|
| Applications | list, health, sync |
| App Details → Tree | objects in the cluster |
| Diff | desired vs live |
| History | sync revisions (rollback — [intermediate](../gitops-intermediate/05-rollback-history.md)) |
| Events | repo, RBAC, hook errors |

## CLI

```bash
argocd app list
argocd app get hello-gitops-direct
argocd app diff hello-gitops-direct
argocd app logs hello-gitops-direct
kubectl describe application hello-gitops-direct -n argocd
```

## Health aggregation

Deployment **Degraded** (CrashLoop) → Application **Degraded**. Fix it in the Git manifests or the image — not a “green check” in the UI.

## kubectl vs argocd

| Task | Tool |
|------|------|
| Pod diagnostics | `kubectl logs`, `describe` |
| GitOps state | `argocd app get`, UI |
| Emergency scale (anti-pattern) | `kubectl scale` → OutOfSync |

## Checklist

- Where do you look for the cause of `ComparisonError`?
- How does `argocd app diff` differ from `kubectl diff`?

Next lesson: [09-vs-ci-apply.md](09-vs-ci-apply.md).
