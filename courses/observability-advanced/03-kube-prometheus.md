# 03. kube-prometheus-stack в Kubernetes

## Введение: «в Docker всё видно, в k8s — слепота»

Локальный [`deploy/observability`](../../deploy/observability/README.md) даёт метрики контейнеров на одном хосте. В **Kubernetes** поды мигрируют, HPA масштабирует, OOMKill не виден в `docker stats`. Стандарт индустрии для учебного кластера — **kube-prometheus-stack** (Prometheus Operator + Grafana + Alertmanager + exporters).

> Опционально. Требует `mockctl up`, Helm, **4+ ГБ RAM**. Install ~5–10 мин.

Базовая установка совпадает с [kuber-advanced/14-observability](../kuber-advanced/14-observability.md); здесь — **интервью-углы** и связь с advanced-курсом.

## Состав стека

| Компонент | Роль |
|-----------|------|
| **Prometheus** | TSDB, PromQL, rules |
| **Alertmanager** | Routing, inhibition, silences |
| **Grafana** | Dashboards, Explore |
| **node-exporter** | CPU, disk, network **ноды** |
| **kube-state-metrics** | Состояние объектов k8s (pod phase, deployments) |
| **prometheus-operator** | CRD: ServiceMonitor, PodMonitor, PrometheusRule |

## Установка (mockctl)

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install kube-prom prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  --set grafana.adminPassword=admin \
  --set prometheus.prometheusSpec.retention=2d \
  --set prometheus.prometheusSpec.resources.requests.memory=512Mi
```

## Доступ к UI

```bash
kubectl port-forward svc/kube-prom-grafana -n monitoring 3000:80
# http://localhost:3000  admin / admin

kubectl port-forward svc/kube-prom-kube-prometheus-prometheus -n monitoring 9090:9090
```

После лабы [kuber-advanced/15](../kuber-advanced/15-lab-observability.md) — сценарий **OOMKilled** и PromQL.

## Метрики, которые спрашивают на собеседовании

| Вопрос | Метрика / источник |
|--------|-------------------|
| Pod CPU | `container_cpu_usage_seconds_total` |
| Pod memory (working set) | `container_memory_working_set_bytes` |
| Restarts | `kube_pod_container_status_restarts_total` |
| Причина последнего terminate | `kube_pod_container_status_last_terminated_reason` |
| Pod не Ready | `kube_pod_status_phase{phase!="Running"}` |

**Зачем kube-state-metrics?** cAdvisor/node-exporter не знают про `Deployment`/`StatefulSet` — только контейнеры. KSM переводит API objects → time series.

## ServiceMonitor — контракт scrape

CRD говорит operator'у: «scrape все Service с label X на port `metrics`».

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: web
  namespace: monitoring
  labels:
    release: kube-prom   # часто нужен label для selector Prometheus
spec:
  namespaceSelector:
    matchNames:
      - default
  selector:
    matchLabels:
      app: web
  endpoints:
    - port: metrics
      interval: 30s
      path: /metrics
```

| Поле | Ошибка новичка |
|------|----------------|
| `selector.matchLabels` | Не совпадает с Service → 0 targets |
| `endpoints.port` | Имя **port** в Service, не number |
| `namespaceSelector` | Monitor в `monitoring`, app в `default` — нужен selector |

Лаба: [04-lab-servicemonitor](04-lab-servicemonitor.md).

## PrometheusRule (алерты в GitOps)

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: high-error-rate
  labels:
    release: kube-prom
spec:
  groups:
    - name: api
      rules:
        - alert: HighErrorRate
          expr: |
            sum(rate(http_requests_total{status=~"5.."}[5m]))
            / sum(rate(http_requests_total[5m])) > 0.05
          for: 5m
          labels:
            severity: warning
```

## Docker-стенд vs k8s vs AWS

| Среда | Метрики | Логи | Traces |
|-------|---------|------|--------|
| `deploy/observability` | Prometheus | Loki (overlay) | Jaeger (overlay) |
| kube-prometheus-stack | Prometheus in-cluster | often Loki/Fluent Bit отдельно | OTel/Jaeger Helm |
| AWS | CloudWatch Metrics | CloudWatch Logs | X-Ray |

CloudWatch alarms и metric filters: [aws-intermediate/19](../aws-intermediate/19-cloudwatch.md). Гибрид: **remote_write** из Prometheus в AMP/Mimir — за рамками лабы, но на senior спрашивают trade-offs.

## На собеседовании

1. **Чем ServiceMonitor лучше аннотаций `prometheus.io/scrape`?** Типизация, RBAC, discovery через CRD, единый GitOps.
2. **Почему pod metrics ≠ node metrics?** Limits, throttling, OOM — на уровне cgroup контейнера.
3. **Как алертить на CrashLoop?** `increase(kube_pod_container_status_restarts_total[15m]) > N`.

## Резюме

- kube-prometheus-stack — полный monitoring baseline для k8s labs.
- KSM + cAdvisor + node-exporter закрывают **инфра**; ServiceMonitor — **приложение**.
- Команды install/port-forward — как в [kuber-advanced/14](../kuber-advanced/14-observability.md).

Следующий урок: [04-lab-servicemonitor.md](04-lab-servicemonitor.md).
