# 06. Лаба: откат ревизии

## Цель

Сломать релиз в Git, затем откатить через **git revert** и через **argocd rollback**.

## Предварительно

`hello-gitops` Application Synced.

## Часть 1 — плохой коммит

В fork временно:

```yaml
# deployment.yaml
image: nginx:does-not-exist-tag
```

Push, дождаться sync.

```bash
kubectl get pods -n gitops-demo
# ImagePullBackOff
argocd app get hello-gitops
# Health Degraded
```

## Часть 2 — git revert

```bash
git revert HEAD
git push
argocd app sync hello-gitops
kubectl get pods -n gitops-demo
# Running
```

## Часть 3 — argocd rollback (опционально)

Снова внесите плохой image, sync. Запомните history id:

```bash
argocd app history hello-gitops
argocd app rollback hello-gitops <previous-id>
```

Проверьте Pod. Затем **выровняйте Git** (revert плохого коммита), иначе при следующем sync снова сломается.

## Критерии успеха

- [ ] Видели Degraded после плохого image
- [ ] Восстановили через revert
- [ ] Понимаете риск rollback без правки Git

Следующий урок: [07-kustomize-helm.md](07-kustomize-helm.md).
