# 16. Argo CD: deploy from git

> Углублённый трек: [gitops-basic](../gitops-basic/README.md) → [gitops-intermediate](../gitops-intermediate/README.md), стенд [`deploy/gitops`](../../deploy/gitops/README.md) на mockctl.

## GitOps в двух словах

**Желаемое состояние** кластера хранится в Git. Контроллер (Argo CD) сравнивает Git с кластером и **синхронизирует**:

```text
Git repo (manifests/helm)
        │
        ▼
   Argo CD Application
        │
        ▼
   Kubernetes cluster
```

Преимущества: аудит, rollback через git revert, один source of truth.

## Компоненты Argo CD

| Компонент | Роль |
|---|---|
| `argocd-server` | UI + API |
| `application-controller` | Синхронизация |
| `repo-server` | Клонирование git, helm template |
| `redis` | Кэш |

## Установка

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=available deploy/argocd-server -n argocd --timeout=300s
```

UI:

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
# https://localhost:8080  user: admin
# password:
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' | base64 -d
```

CLI:

```bash
brew install argocd   # или скачать binary
argocd login localhost:8080 --username admin --password <pwd> --insecure
```

## Application

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: mock-exams
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/FedorArbuzov/mock-exams.git
    targetRevision: master
    path: deploy/demo          # каталог с манифестами
  destination:
    server: https://kubernetes.default.svc
    namespace: demo
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

| Поле | Значение |
|---|---|
| `automated` | Синхронизировать при изменении git |
| `prune` | Удалять из кластера то, чего нет в git |
| `selfHeal` | Откатывать ручные `kubectl edit` |
| `CreateNamespace=true` | Создать namespace, если нет |

## Sync modes

- **Manual** — кнопка Sync в UI / `argocd app sync`.
- **Auto** — при push в git.

## Helm source

```yaml
source:
  repoURL: https://github.com/...
  path: charts/myapp
  helm:
    valueFiles:
      - values-prod.yaml
```

## Полезные команды

```bash
argocd app list
argocd app get mock-exams
argocd app sync mock-exams
argocd app diff mock-exams
kubectl get applications -n argocd
```

## Чек-лист

- Что такое selfHeal?
- Чем Argo CD отличается от `kubectl apply` в CI?
- Где хранится desired state?
- Что делает `prune`?

Лаба: [17-lab-argocd.md](17-lab-argocd.md) — краткая лаба; полный курс — [gitops-basic/05](../gitops-basic/05-lab-first-application.md).
