# 03. Sync waves and resource ordering

## Why ordering matters

A Deployment references a ConfigMap, a CRD must exist before its CR — with a parallel apply you can get **transient** errors.

**Sync waves** — an annotation on a resource:

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "0"
```

A smaller number → earlier. Within one wave — in parallel.

## Example in the stand

[`deploy/gitops/manifests/sync-waves/`](../../deploy/gitops/manifests/sync-waves/):

| Wave | Resource |
|------|--------|
| 0 | ConfigMap `waves-config` |
| 1 | Deployment `waves-demo` (env from CM) |
| 2 | Service `waves-demo` |

## Hooks (briefly)

`argocd.argoproj.io/hook: PreSync|PostSync` — a Job for DB migrations. We don't lab this in the course; in prod it is **mandatory** for schema migrations.

## Sync options on the Application

```yaml
syncOptions:
  - ApplyOutOfSyncOnly=true
  - PruneLast=true
```

Use them deliberately — read the Argo docs for your version.

## Checklist

- What happens if a Deployment (wave 1) syncs before a ConfigMap that has no wave?
- Where do you see the order in the UI? (Events, sync operation)

Lab: [04-lab-sync-waves.md](04-lab-sync-waves.md).
