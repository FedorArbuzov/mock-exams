# 27. Финальный проект: платформа на minikube

> Проходите **после** фаз 1–3 и желательно 14–15 (Prometheus). Собирает всё в одну схему.

## Цель

Развернуть «минимальную платформу»:

- **Argo CD** — GitOps из `mock-exams` репо
- **kube-prometheus-stack** — метрики и Grafana
- **PSA restricted** на app namespace
- **Kyverno** — запрет `:latest`
- **Audit** — понимание где смотреть логи

## Чек-лист компонентов

```bash
# 1. Кластер
mockctl up

# 2. Monitoring (фаза 4 опционально)
helm install kube-prom prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  --set grafana.adminPassword=admin

# 3. Argo CD (фаза 3)
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# 4. Kyverno (фаза 2)
helm install kyverno kyverno/kyverno -n kyverno --create-namespace

# 5. App namespace с PSA
kubectl create namespace platform-apps
kubectl label namespace platform-apps \
  pod-security.kubernetes.io/enforce=restricted

# 6. Application в Argo → path deploy/argocd-demo (из лабы 17)

# 7. ClusterPolicy disallow-latest (из лабы 11)
```

## Проверка «всё работает»

| Проверка | Команда |
|---|---|
| Apps synced | `kubectl get application -n argocd` |
| Pods running | `kubectl get pods -n platform-apps` |
| Grafana | `kubectl port-forward -n monitoring svc/kube-prom-grafana 3000:80` |
| PSA blocks bad pod | `kubectl run bad --image=nginx:latest -n platform-apps` → Forbidden |
| Latest blocked | Kyverno policy |
| Metrics | Grafana dashboard Kubernetes / Views |

## Документ для README проекта

Добавьте в репозиторий `deploy/README.md`:

```markdown
## Platform stack
- mockctl up
- helm: monitoring, kyverno, argocd
- Application: deploy/argocd-demo
```

## Что вы доказали

Прошли путь от «поднять pod» до «платформа с GitOps, observability, policy и security» — на одном ноутбуке.

## Дальше

- [`mock-ckad`](../mock-ckad/README.md) — экзамены на скорость
- Production: managed Kubernetes (EKS/GKE/AKS) — те же паттерны, другой scale
