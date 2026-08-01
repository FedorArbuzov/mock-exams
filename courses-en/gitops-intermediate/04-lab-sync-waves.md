# 04. Lab: ConfigMap → Deploy → Service

## Goal

Confirm that the `sync-waves` Application brings up the stack in `gitops-waves` without ordering errors.

## Prerequisites

App-of-apps from [lab 02](02-lab-app-of-apps.md), or manually:

```bash
kubectl apply -f deploy/gitops/apps/sync-waves.yaml
# repoURL must be your fork
```

## Steps

```bash
argocd app sync sync-waves
kubectl get cm,deploy,svc -n gitops-waves
kubectl describe deploy waves-demo -n gitops-waves | grep -A2 DEMO_MESSAGE
```

Change `configmap.yaml` in Git:

```yaml
MESSAGE: "wave-updated"
```

Push → sync → check the env in the Pod (you may need to restart the Deployment or wait for the rollout).

```bash
kubectl rollout restart deploy waves-demo -n gitops-waves
# or wait for selfHeal from the pod template change in Git
```

## Observation in the UI

Application `sync-waves` → Sync → watch the **time** at which resources appear in Events (wave 0 → 1 → 2).

## Success criteria

- [ ] All three resources Synced
- [ ] Pod Running, env `DEMO_MESSAGE` from the ConfigMap
- [ ] After changing MESSAGE in Git the value updated (after sync/restart)

Next lesson: [05-rollback-history.md](05-rollback-history.md).
