# 02. Лаба: gitops-root и дочерние apps

## Цель

Поднять **app-of-apps**: root синкает `apps/`, дочерние apps — workload.

## Предварительно

- Argo CD установлен ([basic/03](../gitops-basic/03-lab-install.md)).
- Fork запушен; в `apps/*.yaml` **repoURL** и **targetRevision** совпадают с вашим remote (или отредактируйте перед push).

## Шаги

```bash
cd deploy/gitops
cp config/repo.env.example config/repo.env
# MOCK_GITOPS_REPO, MOCK_GITOPS_REVISION

bash scripts/bootstrap-root.sh
kubectl get applications -n argocd
```

Ожидаемые Application: `gitops-root`, `hello-gitops`, `sync-waves`.

```bash
kubectl get pods -n gitops-demo
kubectl get pods -n gitops-waves
```

В UI: дерево `gitops-root` → children.

## Ожидаемый результат

| Application | Namespace | Workload |
|-------------|-----------|----------|
| hello-gitops | gitops-demo | nginx 2 replicas |
| sync-waves | gitops-waves | waves-demo 1 replica |

## Критерии успеха

- [ ] `gitops-root` Synced
- [ ] Оба child Application Healthy
- [ ] Понимаете, что изменение `apps/` требует push в Git

## Ошибки

| Симптом | Действие |
|---------|----------|
| Только root, нет children | path `deploy/gitops/apps` в remote; файлы запушены |
| Child Invalid spec | YAML в `apps/`; repoURL |

Следующий урок: [03-sync-waves.md](03-sync-waves.md).
