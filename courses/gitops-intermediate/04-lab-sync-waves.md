# 04. Лаба: ConfigMap → Deploy → Service

## Цель

Убедиться, что `sync-waves` Application поднимает стек в `gitops-waves` без ошибок ordering.

## Предварительно

App-of-apps из [лабы 02](02-lab-app-of-apps.md) или вручную:

```bash
kubectl apply -f deploy/gitops/apps/sync-waves.yaml
# repoURL должен быть ваш fork
```

## Шаги

```bash
argocd app sync sync-waves
kubectl get cm,deploy,svc -n gitops-waves
kubectl describe deploy waves-demo -n gitops-waves | grep -A2 DEMO_MESSAGE
```

Измените в Git `configmap.yaml`:

```yaml
MESSAGE: "wave-updated"
```

Push → sync → проверьте env в Pod (может понадобиться restart Deployment или дождаться rollout).

```bash
kubectl rollout restart deploy waves-demo -n gitops-waves
# или дождаться selfHeal от изменения pod template в Git
```

## Наблюдение в UI

Application `sync-waves` → Sync → смотрите **время** появления ресурсов в Events (wave 0 → 1 → 2).

## Критерии успеха

- [ ] Все три ресурса Synced
- [ ] Pod Running, env `DEMO_MESSAGE` из ConfigMap
- [ ] После смены MESSAGE в Git значение обновилось (после sync/restart)

Следующий урок: [05-rollback-history.md](05-rollback-history.md).
