# 06. Lab: reverting a revision

## Goal

Break a release in Git, then roll it back via **git revert** and via **argocd rollback**.

## Prerequisites

`hello-gitops` Application Synced.

## Part 1 — a bad commit

Temporarily, in the fork:

```yaml
# deployment.yaml
image: nginx:does-not-exist-tag
```

Push, wait for the sync.

```bash
kubectl get pods -n gitops-demo
# ImagePullBackOff
argocd app get hello-gitops
# Health Degraded
```

## Part 2 — git revert

```bash
git revert HEAD
git push
argocd app sync hello-gitops
kubectl get pods -n gitops-demo
# Running
```

## Part 3 — argocd rollback (optional)

Introduce the bad image again, sync. Note the history id:

```bash
argocd app history hello-gitops
argocd app rollback hello-gitops <previous-id>
```

Check the Pod. Then **align Git** (revert the bad commit), otherwise it will break again on the next sync.

## Success criteria

- [ ] Saw Degraded after the bad image
- [ ] Recovered via revert
- [ ] You understand the risk of a rollback without fixing Git

Next lesson: [07-kustomize-helm.md](07-kustomize-helm.md).
