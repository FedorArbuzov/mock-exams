# 14. kube-prometheus-stack

> Optional. Requires Helm and **4+ GB RAM**. Install ~5–10 min.

Basic PromQL, Grafana, alerts, and SLOs are in a separate course track: [observability-basic](../observability-basic/README.md) → [intermediate](../observability-intermediate/README.md) → [advanced](../observability-advanced/README.md) (bench [`deploy/observability`](../../deploy/observability/README.md)). This chapter covers the **Kubernetes-specifics** (ServiceMonitor, kube-state-metrics).

## The stack

| Component | Role |
|---|---|
| Prometheus | Collecting and storing metrics |
| Alertmanager | Alerts |
| Grafana | Dashboards |
| node-exporter | Node metrics |
| kube-state-metrics | Metrics for k8s objects |

## Installation

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install kube-prom prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  --set grafana.adminPassword=admin \
  --set prometheus.prometheusSpec.retention=2d \
  --set prometheus.prometheusSpec.resources.requests.memory=512Mi
```

## Access

```bash
kubectl port-forward svc/kube-prom-grafana -n monitoring 3000:80
# http://localhost:3000  admin / admin

kubectl port-forward svc/kube-prom-kube-prometheus-prometheus -n monitoring 9090:9090
# Prometheus UI
```

## Useful metrics

- `container_cpu_usage_seconds_total`
- `container_memory_working_set_bytes`
- `kube_pod_status_phase`
- `kube_pod_container_status_restarts_total`

## ServiceMonitor

A CRD from prometheus-operator — how to scrape your applications:

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

## Checklist

- Why kube-state-metrics?
- Where do you view pod CPU metrics?
- What is a ServiceMonitor?

Lab: [15-lab-observability.md](15-lab-observability.md).
