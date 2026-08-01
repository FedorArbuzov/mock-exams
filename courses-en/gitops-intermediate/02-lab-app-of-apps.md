# 02. Lab: gitops-root and child apps

## Goal

Bring up **app-of-apps**: the root syncs `apps/`, and the child apps run the workloads.

## Prerequisites

- Argo CD is installed ([basic/03](../gitops-basic/03-lab-install.md)).
- Fork is pushed; in `apps/*.yaml` the **repoURL** and **targetRevision** match your remote (or edit them before push).

## Steps

```bash
cd deploy/gitops
cp config/repo.env.example config/repo.env
# MOCK_GITOPS_REPO, MOCK_GITOPS_REVISION

bash scripts/bootstrap-root.sh
kubectl get applications -n argocd
```

Expected Applications: `gitops-root`, `hello-gitops`, `sync-waves`.

```bash
kubectl get pods -n gitops-demo
kubectl get pods -n gitops-waves
```

In the UI: the `gitops-root` tree → children.

## Expected result

| Application | Namespace | Workload |
|-------------|-----------|----------|
| hello-gitops | gitops-demo | nginx 2 replicas |
| sync-waves | gitops-waves | waves-demo 1 replica |

## Success criteria

- [ ] `gitops-root` Synced
- [ ] Both child Applications Healthy
- [ ] You understand that changing `apps/` requires a push to Git

## Errors

| Symptom | Action |
|---------|----------|
| Only root, no children | path `deploy/gitops/apps` in remote; files pushed |
| Child Invalid spec | YAML in `apps/`; repoURL |

Next lesson: [03-sync-waves.md](03-sync-waves.md).
