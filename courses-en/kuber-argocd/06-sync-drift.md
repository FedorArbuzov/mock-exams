# 06. Sync vs Health, selfHeal, prune

## Two axes

| Axis | Question | Bad example |
|------|----------|-------------|
| **Sync** | Does live match Git? | `kubectl scale` → OutOfSync |
| **Health** | Is the object usable? | image pull error → Degraded |

OutOfSync is not always an incident (you might be rolling a canary in Git). **Degraded + Synced** means Git is “correct” and the app is still broken.

## Drift

```bash
kubectl -n lab-argocd scale deploy/hello --replicas=3
```

Git still says `replicas: 1`. Application → **OutOfSync**. Diff in the UI shows the replica field.

## selfHeal

With `syncPolicy.automated.selfHeal: true`, the controller **writes Git’s value back** (typically within the timeout / jitter, often well under a minute on a laptop).

| selfHeal | Behavior |
|----------|----------|
| `false` | drift stays until you Sync or change Git |
| `true` | cluster follows Git; hotfixes via `kubectl` do not last |

Hotfix workflow: **commit** the change (or disable auto-sync briefly — and remember to turn it back on).

## prune

Delete `Service` from Git, push, sync with `prune: true` → Service **gone** from the cluster.

Without prune, Argo leaves **orphans**. That is safer on a first prod rollout; it is also how leftover Ingresses survive “cleanup.”

## Sync options you will see

| Option | Use |
|--------|-----|
| `CreateNamespace=true` | labs; avoid in tightly controlled prod |
| `PrunePropagationPolicy=foreground` | order deletes |
| `ServerSideApply=true` | fewer field-manager fights (optional) |
| `RespectIgnoreDifferences=true` | with `ignoreDifferences` |

**Sync waves** / hooks exist (`argocd.argoproj.io/sync-wave`) for “CM then Deploy then Service.” We do **not** drill them; if a Job must run before a Deployment, prefer a Helm hook or a wave annotation later.

## Rollback

Two layers:

1. **Git** — `git revert` / revert the MR; Argo syncs. This is the GitOps-native rollback.  
2. **Argo history** — UI **History and Rollback** to a previous **sync revision** (the rendered set Argo applied). Useful when Git already moved on; still prefer fixing Git.

## When to keep auto-sync **off**

- Prod with a change advisory board (sync is the “deploy button”)  
- Ordered migrations you have not encoded as waves/hooks  
- First apply of a scary CRD

## Checklist

- [ ] OutOfSync vs Degraded — can both be true?  
- [ ] What does selfHeal undo?  
- [ ] Risk of `prune: true` on prod?  

Next lab: [07. Lab: self-heal and prune](07-lab-self-heal.md).
