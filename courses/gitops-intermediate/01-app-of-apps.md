# 01. App-of-apps и root Application

## Проблема десятка Application

Вручную `kubectl apply` десяти Application — дублирование `repoURL`, риск опечаток, нет единой точки включения **staging/prod**.

## Паттерн app-of-apps

```text
gitops-root (Application)
    ├── app: hello-gitops   → path manifests/hello-gitops
    └── app: sync-waves    → path manifests/sync-waves
```

Root Application указывает `path: deploy/gitops/apps` — каталог с **дочерними** Application YAML.

В репозитории:

- [`bootstrap/root-application.yaml`](../../deploy/gitops/bootstrap/root-application.yaml)
- [`apps/hello-gitops.yaml`](../../deploy/gitops/apps/hello-gitops.yaml)
- [`apps/sync-waves.yaml`](../../deploy/gitops/apps/sync-waves.yaml)

## Bootstrap

Root обычно применяют **один раз** с ноутбука (не хранят в том же каталоге, который он синкает — иначе chicken-and-egg):

```bash
source config/repo.env
envsubst < bootstrap/root-application.yaml | kubectl apply -f -
```

Скрипт: [`scripts/bootstrap-root.sh`](../../deploy/gitops/scripts/bootstrap-root.sh).

## Finalizer

```yaml
finalizers:
  - resources-finalizer.argocd.argoproj.io
```

При удалении root — каскадное удаление дочерних ресурсов (осторожно на prod).

## Чек-лист

- Чем root отличается от обычного Application?
- Почему дочерние Application тоже лежат в Git?
- Что будет при удалении root Application?

Лаба: [02-lab-app-of-apps.md](02-lab-app-of-apps.md).
