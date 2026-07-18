# 02. Argo CD: компоненты и поток sync

## Компоненты

| Pod / Deploy | Роль |
|--------------|------|
| `argocd-server` | UI, API, SSO |
| `application-controller` | Сравнение desired vs live, sync |
| `repo-server` | `git clone`, `helm template`, kustomize build |
| `redis` | Кэш manifest |

Namespace по умолчанию: **`argocd`**. Application CR живут в **`argocd`**, а workload — в **destination namespace** (например `gitops-demo`).

## Application — центральная абстракция

```text
Application.spec.source     →  что читать из Git (repo, path, helm)
Application.spec.destination →  куда применять (cluster, namespace)
Application.spec.syncPolicy  →  auto/manual, prune, selfHeal
```

Статусы, которые увидите в UI:

| Health | Sync |
|--------|------|
| Healthy, Progressing, Degraded | Synced, OutOfSync |

## Поток одного sync

1. Repo-server клонирует репозиторий на `targetRevision`.
2. Рендер (plain YAML / Kustomize / Helm).
3. Controller сравнивает с live objects.
4. При sync — create/update/delete по diff.
5. `prune: true` — удалить из кластера лишнее.

## Локальный стенд курса

Манифесты: [`deploy/gitops/manifests/hello-gitops`](../../deploy/gitops/manifests/hello-gitops/).

Установка: [`deploy/gitops/scripts/install-argocd.sh`](../../deploy/gitops/scripts/install-argocd.sh).

Краткий обзор в [kuber-advanced/16](../kuber-advanced/16-argocd.md) — те же идеи, меньше деталей.

## Чек-лист

- Зачем отдельный `repo-server`?
- Application в namespace `argocd` — куда попадут Pod приложения?
- Что произойдёт при удалении файла из Git при `prune: true`?

Лаба: [03-lab-install.md](03-lab-install.md).
