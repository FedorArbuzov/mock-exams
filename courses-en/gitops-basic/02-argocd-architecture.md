# 02. Argo CD: components and sync flow

## Components

| Pod / Deploy | Role |
|--------------|------|
| `argocd-server` | UI, API, SSO |
| `application-controller` | Compares desired vs live, sync |
| `repo-server` | `git clone`, `helm template`, kustomize build |
| `redis` | Manifest cache |

Default namespace: **`argocd`**. Application CRs live in **`argocd`**; workloads live in the **destination namespace** (for example `gitops-demo`).

## Application — the central abstraction

```text
Application.spec.source     →  what to read from Git (repo, path, helm)
Application.spec.destination →  where to apply (cluster, namespace)
Application.spec.syncPolicy  →  auto/manual, prune, selfHeal
```

Statuses you’ll see in the UI:

| Health | Sync |
|--------|------|
| Healthy, Progressing, Degraded | Synced, OutOfSync |

## One sync flow

1. Repo-server clones the repository at `targetRevision`.
2. Render (plain YAML / Kustomize / Helm).
3. Controller compares against live objects.
4. On sync — create/update/delete from the diff.
5. `prune: true` — remove extras from the cluster.

## Course local environment

Manifests: [`deploy/gitops/manifests/hello-gitops`](../../deploy/gitops/manifests/hello-gitops/).

Install: [`deploy/gitops/scripts/install-argocd.sh`](../../deploy/gitops/scripts/install-argocd.sh).

Brief overview in [kuber-advanced/16](../kuber-advanced/16-argocd.md) — same ideas, fewer details.

## Checklist

- Why a separate `repo-server`?
- Application is in namespace `argocd` — where do the app Pods land?
- What happens when you delete a file from Git with `prune: true`?

Lab: [03-lab-install.md](03-lab-install.md).
