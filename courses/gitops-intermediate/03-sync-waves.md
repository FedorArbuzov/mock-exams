# 03. Sync waves и порядок ресурсов

## Зачем порядок

Deployment ссылается на ConfigMap, CRD должен существовать до CR — при параллельном apply возможны **временные** ошибки.

**Sync waves** — аннотация на ресурсе:

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "0"
```

Меньшее число → раньше. В одной волне — параллельно.

## Пример в стенде

[`deploy/gitops/manifests/sync-waves/`](../../deploy/gitops/manifests/sync-waves/):

| Wave | Ресурс |
|------|--------|
| 0 | ConfigMap `waves-config` |
| 1 | Deployment `waves-demo` (env из CM) |
| 2 | Service `waves-demo` |

## Hooks (кратко)

`argocd.argoproj.io/hook: PreSync|PostSync` — Job на миграции БД. В курсе не лабируем; на prod — обязательны для schema migrate.

## Sync options на Application

```yaml
syncOptions:
  - ApplyOutOfSyncOnly=true
  - PruneLast=true
```

Используйте осознанно — читайте документацию Argo для вашей версии.

## Чек-лист

- Что будет, если Deployment (wave 1) синканётся раньше ConfigMap без wave?
- Где смотреть порядок в UI? (Events sync operation)

Лаба: [04-lab-sync-waves.md](04-lab-sync-waves.md).
