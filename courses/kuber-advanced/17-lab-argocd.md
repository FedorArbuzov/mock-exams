# 17. Лаба: GitOps на репозитории mock-exams

> **Рекомендуется:** манифесты и скрипты в [`deploy/gitops`](../../deploy/gitops/README.md), курс [gitops-basic](../gitops-basic/README.md). Ниже — упрощённый вариант «с нуля в fork».

## Задание 1. Подготовить манифесты в репо

Используйте готовый каталог [`deploy/gitops/manifests/hello-gitops`](../../deploy/gitops/manifests/hello-gitops/) **или** создайте `deploy/argocd-demo/`:

`deploy/argocd-demo/deployment.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-gitops
spec:
  replicas: 2
  selector:
    matchLabels: { app: hello-gitops }
  template:
    metadata:
      labels: { app: hello-gitops }
    spec:
      containers:
        - name: c
          image: nginx:1.27-alpine
          ports: [{ containerPort: 80 }]
---
apiVersion: v1
kind: Service
metadata:
  name: hello-gitops
spec:
  selector: { app: hello-gitops }
  ports: [{ port: 80 }]
```

Закоммитьте и запушьте в GitHub.

## Задание 2. Установить Argo CD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl wait --for=condition=available deploy/argocd-server -n argocd --timeout=300s
```

## Задание 3. Создать Application

`app.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: mock-exams-demo
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/FedorArbuzov/mock-exams.git
    targetRevision: master
    path: deploy/argocd-demo
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

```bash
kubectl apply -f app.yaml
kubectl get application -n argocd
kubectl get pods -n gitops-demo
```

**Что увидите:** Argo подтянул манифесты, namespace создан, 2 pod Running.

## Задание 4. Self-heal

```bash
kubectl scale deploy hello-gitops -n gitops-demo --replicas=5
sleep 30
kubectl get deploy hello-gitops -n gitops-demo
```

**Что увидите:** replicas вернулись к 2 (git = source of truth).

## Задание 5. Git-driven change

В репо измените `replicas: 3`, push. Подождите ~3 мин (или нажмите Sync в UI).

```bash
kubectl get deploy hello-gitops -n gitops-demo
```

## Задание 6. UI

```bash
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

Откройте https://localhost:8080 — посмотрите Application, Diff, History.

## Уборка

```bash
kubectl delete application mock-exams-demo -n argocd
kubectl delete namespace gitops-demo argocd
```

## Вопросы для самопроверки

1. Что произойдёт при ручном `kubectl scale`, если включён selfHeal?
2. Что делает `prune: true`?
3. Зачем `CreateNamespace=true`?
