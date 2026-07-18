# 14. kube-prometheus-stack

> Опционально. Требует Helm и **4+ ГБ RAM**. Install ~5–10 мин.

Базовые PromQL, Grafana, алерты и SLO — в отдельной ветке курсов: [observability-basic](../observability-basic/README.md) → [intermediate](../observability-intermediate/README.md) → [advanced](../observability-advanced/README.md) (стенд [`deploy/observability`](../../deploy/observability/README.md)). Эта глава — **Kubernetes-специфика** (ServiceMonitor, kube-state-metrics).

## Стек

| Компонент | Роль |
|---|---|
| Prometheus | Сбор и хранение метрик |
| Alertmanager | Алерты |
| Grafana | Дашборды |
| node-exporter | Метрики нод |
| kube-state-metrics | Метрики объектов k8s |

## Установка

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install kube-prom prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  --set grafana.adminPassword=admin \
  --set prometheus.prometheusSpec.retention=2d \
  --set prometheus.prometheusSpec.resources.requests.memory=512Mi
```

## Доступ

```bash
kubectl port-forward svc/kube-prom-grafana -n monitoring 3000:80
# http://localhost:3000  admin / admin

kubectl port-forward svc/kube-prom-kube-prometheus-prometheus -n monitoring 9090:9090
# Prometheus UI
```

## Полезные метрики

- `container_cpu_usage_seconds_total`
- `container_memory_working_set_bytes`
- `kube_pod_status_phase`
- `kube_pod_container_status_restarts_total`

## ServiceMonitor

CRD от prometheus-operator — как scrape ваши приложения:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: web
spec:
  selector:
    matchLabels:
      app: web
  endpoints:
    - port: metrics
      interval: 30s
```

## Чек-лист

- Зачем kube-state-metrics?
- Где смотреть метрики pod CPU?
- Что такое ServiceMonitor?

Лаба: [15-lab-observability.md](15-lab-observability.md).
