# 06. Synced / OutOfSync, selfHeal, prune

## Drift

**Drift** is a mismatch between Git (desired) and the cluster (live).

```bash
kubectl scale deploy hello-gitops -n gitops-demo --replicas=5
```

In the UI the Application becomes **OutOfSync** (replicas in Git = 2, in the cluster = 5).

## selfHeal

With `syncPolicy.automated.selfHeal: true`, the controller **restores** replicas to the value from Git without your involvement (usually within ~3 min or right after the sync interval).

| selfHeal | Behavior |
|----------|----------|
| `true` | cluster follows Git |
| `false` | drift remains until manual Sync or a Git change |

## prune

Delete the hello-gitops `Service` from Git and sync with `prune: true` — the Service **disappears** from the cluster.

Without prune — the “orphaned” object stays (risky for leftover junk; useful carefully on prod).

## Manual sync

```bash
argocd app sync hello-gitops-direct
argocd app diff hello-gitops-direct
```

## When to disable auto

- Migrations that need a manual order (sync waves — [intermediate](../gitops-intermediate/03-sync-waves.md)).
- Canary — temporarily a different image in the cluster (better: a separate overlay in Git).

## Checklist

- Is OutOfSync always bad?
- How does selfHeal differ from “just don’t touch the cluster”?
- Risk of `prune: true` on prod?

Lab: [07-lab-self-heal.md](07-lab-self-heal.md).
