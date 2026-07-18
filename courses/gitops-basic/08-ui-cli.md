# 08. UI, CLI, diff и health

## UI (после port-forward)

| Раздел | Зачем |
|--------|-------|
| Applications | список, health, sync |
| App Details → Tree | объекты в кластере |
| Diff | desired vs live |
| History | ревизии sync (rollback — [intermediate](../gitops-intermediate/05-rollback-history.md)) |
| Events | ошибки repo, RBAC, hook |

## CLI

```bash
argocd app list
argocd app get hello-gitops-direct
argocd app diff hello-gitops-direct
argocd app logs hello-gitops-direct
kubectl describe application hello-gitops-direct -n argocd
```

## Health агрегация

Deployment **Degraded** (CrashLoop) → Application **Degraded**. Исправление — в манифестах Git или образе, не «зелёная галочка» в UI.

## kubectl vs argocd

| Задача | Инструмент |
|--------|------------|
| Диагностика Pod | `kubectl logs`, `describe` |
| Состояние GitOps | `argocd app get`, UI |
| Экстренный scale (антипаттерн) | `kubectl scale` → OutOfSync |

## Чек-лист

- Где смотреть причина `ComparisonError`?
- Чем `argocd app diff` отличается от `kubectl diff`?

Следующий урок: [09-vs-ci-apply.md](09-vs-ci-apply.md).
