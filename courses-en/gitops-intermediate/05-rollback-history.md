# 05. History, rollback, git revert

## Revisions in Argo CD

Every successful **sync** is an entry in the Application's **History**: the Git commit, who synced, a manifest snapshot.

## Rollback in the UI / CLI

```bash
argocd app history hello-gitops
argocd app rollback hello-gitops <id>
```

It rolls the cluster back to **the state of that revision** (live manifests), without changing Git automatically.

| Method | Git | Cluster |
|-------|-----|---------|
| `app rollback` | may stay "ahead" | rollback to the old revision |
| `git revert` + sync | canonical in Git | adjusts to match Git |

**Production:** prefer **git revert** (audit, reproducibility). Argo rollback is for fast recovery, then align Git afterward.

## The "bad release" scenario

1. Push with a broken image tag → Degraded.
2. `git revert` the commit **or** `argocd app rollback`.
3. Confirm Synced + Healthy.
4. Postmortem: why the sync went through (policy, preview diff).

## Image tag vs digest

A `latest` or floating `1.2` tag — Argo won't see the change without a commit. Better to use an **immutable tag** (SHA) in Git ([gitlab-advanced/11](../gitlab-advanced/11-gitlab-and-argocd.md)).

## Checklist

- How does Argo rollback differ from git revert?
- Why can the Application become OutOfSync again after a rollback?

Lab: [06-lab-rollback.md](06-lab-rollback.md).
