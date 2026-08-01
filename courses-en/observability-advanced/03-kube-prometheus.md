# 03. kube-prometheus-stack in Kubernetes

## Intro: "in Docker you see everything, in k8s you're blind"

The local [`deploy/observability`](../../deploy/observability/README.md) gives you container metrics on a single host. In **Kubernetes** pods migrate, the HPA scales, and OOMKill isn't visible in `docker stats`. The industry standard for a learning cluster is **kube-prometheus-stack** (Prometheus Operator + Grafana + Alertmanager + exporters).

> Optional. Requires `mockctl up`, Helm, **4+ GB RAM**. Install takes ~5–10 min.

The base installation matches [kuber-advanced/14-observability](../kuber-advanced/14-observability.md); here we focus on the **interview angles** and the relation to the advanced course.

## Stack components

| Component | Role |
|-----------|------|
| **Prometheus** | TSDB, PromQL, rules |
| **Alertmanager** | Routing, inhibition, silences |
| **Grafana** | Dashboards, Explore |
| **node-exporter** | CPU, disk, network of the **node** |
| **kube-state-metrics** | State of k8s objects (pod phase, deployments) |
| **prometheus-operator** | CRDs: ServiceMonitor, PodMonitor, PrometheusRule |

## Installation (mockctl)

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install kube-prom prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  --set grafana.adminPassword=admin \
  --set prometheus.prometheusSpec.retention=2d \
  --set prometheus.prometheusSpec.resources.requests.memory=512Mi
```

## Accessing the UI

```bash
kubectl port-forward svc/kube-prom-grafana -n monitoring 3000:80
# http://localhost:3000  admin / admin

kubectl port-forward svc/kube-prom-kube-prometheus-prometheus -n monitoring 9090:9090
```

After the [kuber-advanced/15](../kuber-advanced/15-lab-observability.md) lab — the **OOMKilled** scenario and PromQL.

## Metrics you get asked about at interviews

| Question | Metric / source |
|--------|-------------------|
| Pod CPU | `container_cpu_usage_seconds_total` |
| Pod memory (working set) | `container_memory_working_set_bytes` |
| Restarts | `kube_pod_container_status_restarts_total` |
| Reason for the last terminate | `kube_pod_container_status_last_terminated_reason` |
| Pod not Ready | `kube_pod_status_phase{phase!="Running"}` |

**Why kube-state-metrics?** cAdvisor/node-exporter don't know about `Deployment`/`StatefulSet` — only containers. KSM turns API objects → time series.

## ServiceMonitor — the scrape contract

The CRD tells the operator: "scrape all Services with label X on port `metrics`."

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: web
  namespace: monitoring
  labels:
    release: kube-prom   # often the label needed for the Prometheus selector
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

| Field | Beginner mistake |
|------|----------------|
| `selector.matchLabels` | Doesn't match the Service → 0 targets |
| `endpoints.port` | The **port** name in the Service, not a number |
| `namespaceSelector` | Monitor in `monitoring`, app in `default` — you need a selector |

Lab: [04-lab-servicemonitor](04-lab-servicemonitor.md).

## PrometheusRule (alerts in GitOps)

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

## Docker stack vs k8s vs AWS

| Environment | Metrics | Logs | Traces |
|-------|---------|------|--------|
| `deploy/observability` | Prometheus | Loki (overlay) | Jaeger (overlay) |
| kube-prometheus-stack | Prometheus in-cluster | often Loki/Fluent Bit separately | OTel/Jaeger Helm |
| AWS | CloudWatch Metrics | CloudWatch Logs | X-Ray |

CloudWatch alarms and metric filters: [aws-intermediate/19](../aws-intermediate/19-cloudwatch.md). Hybrid: **remote_write** from Prometheus to AMP/Mimir — beyond the scope of the lab, but at the senior level you get asked about the trade-offs.

## At the interview

1. **Why is ServiceMonitor better than `prometheus.io/scrape` annotations?** Typing, RBAC, discovery via CRD, unified GitOps.
2. **Why are pod metrics ≠ node metrics?** Limits, throttling, OOM — at the container cgroup level.
3. **How do you alert on CrashLoop?** `increase(kube_pod_container_status_restarts_total[15m]) > N`.

## Summary

- kube-prometheus-stack is a full monitoring baseline for k8s labs.
- KSM + cAdvisor + node-exporter cover the **infra**; ServiceMonitor covers the **application**.
- The install/port-forward commands are the same as in [kuber-advanced/14](../kuber-advanced/14-observability.md).

Next lesson: [04-lab-servicemonitor.md](04-lab-servicemonitor.md).
