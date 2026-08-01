# 07. Lab: self-heal and prune

## Goal

See self-heal after a manual scale and understand prune on a test resource.

## Prerequisites

Application `hello-gitops-direct` in Synced state ([lab 05](05-lab-first-application.md)).

## Part 1 — self-heal

```bash
kubectl scale deploy hello-gitops -n gitops-demo --replicas=5
kubectl get deploy hello-gitops -n gitops-demo -o jsonpath='{.spec.replicas}{"\n"}'
# 5

# wait 1–3 min or:
argocd app sync hello-gitops-direct

kubectl get deploy hello-gitops -n gitops-demo -o jsonpath='{.spec.replicas}{"\n"}'
# 2
```

In the UI: History — a sync entry after the drift.

## Part 2 — Git-driven change

In your fork, edit `deploy/gitops/manifests/hello-gitops/deployment.yaml`:

```yaml
replicas: 3
```

Commit, push. Wait for auto-sync or Sync in the UI.

```bash
kubectl get deploy hello-gitops -n gitops-demo -o jsonpath='{.spec.replicas}{"\n"}'
# 3
```

Restore `replicas: 2` in Git after the experiment.

## Part 3 — prune (carefully)

On a branch copy, delete `service.yaml` from hello-gitops, push, sync.

```bash
kubectl get svc hello-gitops -n gitops-demo
# NotFound after sync
```

Restore the Service from Git and sync again.

## Success criteria

- [ ] Scale rolls back with selfHeal
- [ ] Push to Git changes replicas
- [ ] You understand that prune deletes the resource from the cluster

Next lesson: [08-ui-cli.md](08-ui-cli.md).
