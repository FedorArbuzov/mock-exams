# 07. Lab: self-heal and prune

## Goal

Turn on **selfHeal** and **prune** on Application `hello`, then prove Git wins over `kubectl scale` and that a deleted Git object disappears from the cluster.

## Prerequisites

- [05-lab-first-app.md](05-lab-first-app.md) — `hello` Synced in `lab-argocd`

## Task 1. Enable prune + selfHeal

```bash
kubectl -n argocd patch application hello --type merge -p "{
  \"spec\": {
    \"syncPolicy\": {
      \"automated\": { \"prune\": true, \"selfHeal\": true },
      \"syncOptions\": [\"CreateNamespace=true\"]
    }
  }
}"
```

UI → **hello** → **App Details** → **SYNC POLICY** should show auto-sync, prune, self-heal.

## Task 2. Drift, then selfHeal

```bash
kubectl -n lab-argocd scale deploy/hello --replicas=3
kubectl -n lab-argocd get deploy hello
# 3 replicas for a few seconds

kubectl -n argocd get application hello
# OutOfSync, then Synced

kubectl -n lab-argocd get deploy hello
# back to 1 replica (Git)
```

Refresh the UI if it lags. Hard refresh:

```bash
kubectl -n argocd annotate application hello \
  argocd.argoproj.io/refresh=hard --overwrite
```

## Task 3. Prune

In **your gitops repo**, add a ConfigMap to `apps/hello/app.yaml` (same file, new document):

```yaml
---
apiVersion: v1
kind: ConfigMap
metadata:
  name: hello-note
data:
  note: "will be pruned"
```

```bash
git add apps/hello/app.yaml && git commit -m "lab: hello-note" && git push
```

Wait until ConfigMap exists:

```bash
kubectl -n lab-argocd get cm hello-note
```

Remove the ConfigMap document from Git, commit, push. With **prune**, it should vanish:

```bash
kubectl -n lab-argocd get cm hello-note
# NotFound
```

Leave Deployment + Service in Git as they were after this lab.

## Success criteria

- [ ] `kubectl scale` is reverted to **1** replica  
- [ ] `hello-note` is created from Git then **pruned**  
- [ ] Application `hello` Synced / Healthy  
- [ ] Interactive Check passes  

## If it fails

| Symptom | Try |
|---------|-----|
| Replicas stay at 3 | selfHeal not patched; wait ~30s; hard refresh |
| ConfigMap never appears | Git path / push; UI Refresh |
| ConfigMap stays after delete | `prune: true` missing; Sync once |

Next: [08. Directory / Helm / Kustomize](08-sources.md).
