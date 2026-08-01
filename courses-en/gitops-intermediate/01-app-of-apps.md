# 01. App-of-apps and the root Application

## The problem with a dozen Applications

Manually running `kubectl apply` on ten Applications means duplicated `repoURL`, a risk of typos, and no single entry point for enabling **staging/prod**.

## The app-of-apps pattern

```text
gitops-root (Application)
    ├── app: hello-gitops   → path manifests/hello-gitops
    └── app: sync-waves    → path manifests/sync-waves
```

The root Application points at `path: deploy/gitops/apps` — a directory with **child** Application YAML files.

In the repository:

- [`bootstrap/root-application.yaml`](../../deploy/gitops/bootstrap/root-application.yaml)
- [`apps/hello-gitops.yaml`](../../deploy/gitops/apps/hello-gitops.yaml)
- [`apps/sync-waves.yaml`](../../deploy/gitops/apps/sync-waves.yaml)

## Bootstrap

The root is usually applied **once** from a laptop (it is not stored in the same directory it syncs — otherwise you get a chicken-and-egg problem):

```bash
source config/repo.env
envsubst < bootstrap/root-application.yaml | kubectl apply -f -
```

Script: [`scripts/bootstrap-root.sh`](../../deploy/gitops/scripts/bootstrap-root.sh).

## Finalizer

```yaml
finalizers:
  - resources-finalizer.argocd.argoproj.io
```

Deleting the root triggers **cascading** deletion of child resources (be careful in prod).

## Checklist

- How does the root differ from a regular Application?
- Why do child Applications also live in Git?
- What happens when you delete the root Application?

Lab: [02-lab-app-of-apps.md](02-lab-app-of-apps.md).
