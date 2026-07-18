# 04. Application CR: source, destination, syncPolicy

## Минимальный Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: hello-gitops-direct
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR/mock-exams.git
    targetRevision: master
    path: deploy/gitops/manifests/hello-gitops
  destination:
    server: https://kubernetes.default.svc
    namespace: gitops-demo
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

## Поля source

| Поле | Назначение |
|------|------------|
| `repoURL` | HTTPS или SSH Git |
| `targetRevision` | branch, tag, commit SHA |
| `path` | каталог с YAML или chart |
| `helm` / `kustomize` | параметры рендера |

Argo CD **не** читает локальные файлы с ноутбука — только то, что в **remote** (исключения: private repo + credentials).

## destination

| Поле | Значение на mockctl |
|------|---------------------|
| `server` | `https://kubernetes.default.svc` — in-cluster |
| `namespace` | куда попадут Deployment/Service |

## syncPolicy

| Опция | Эффект |
|-------|--------|
| `automated` | sync при изменении Git |
| `selfHeal: true` | откат ручного `kubectl edit` |
| `prune: true` | удалить ресурсы, убранные из Git |
| `CreateNamespace=true` | создать NS при первом sync |

## Project (кратко)

`project: default` — без ограничений. В enterprise — AppProject с whitelist repo/namespace/cluster.

Шаблон в репозитории: [`examples/application-hello.yaml`](../../deploy/gitops/examples/application-hello.yaml).

## Чек-лист

- Почему Application в namespace `argocd`, а Pod — в `gitops-demo`?
- Что будет, если `targetRevision` указывает на несуществующую ветку?
- Зачем `CreateNamespace=true`?

Лаба: [05-lab-first-application.md](05-lab-first-application.md).
