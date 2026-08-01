# 15. ServiceMonitor: application metrics in Kubernetes

> **Theory.** Lab install of kube-prometheus-stack is in [kuber-advanced/14-observability.md](../kuber-advanced/14-observability.md) and [15-lab-observability.md](../kuber-advanced/15-lab-observability.md). This course’s local Docker stand **does not replace** k8s, but teaches the same PromQL and alert concepts.

## The problem

A cluster has dozens of services with `/metrics` on different ports. Hand-writing every target in `prometheus.yml` doesn’t work — pods are ephemeral.

**prometheus-operator** (part of **kube-prometheus-stack**) introduces CRDs that describe **how** to scrape apps declaratively.

## kube-prometheus-stack (recap)

| Component | Role |
|-----------|------|
| Prometheus Operator | Reconcile Prometheus, rules, monitors |
| Prometheus | TSDB |
| Alertmanager | Routing |
| Grafana | Dashboards |
| node-exporter | Node metrics |
| kube-state-metrics | API object metrics (pod phase, deployments) |

Install and port-forward — in [kuber-advanced/14-observability.md](../kuber-advanced/14-observability.md).

## ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: demo-app
  namespace: monitoring
  labels:
    release: kube-prom    # often required for the Prometheus CR selector
spec:
  namespaceSelector:
    matchNames:
      - default
  selector:
    matchLabels:
      app: demo-app
  endpoints:
    - port: metrics
      path: /metrics
      interval: 30s
```

The Operator generates scrape config:

- finds `Service` with `matchLabels`;
- reads port names from `endpoints[].port`;
- adds targets to Prometheus without hand-editing a ConfigMap.

## Service: metrics port

The Deployment must expose a port whose **name** matches the ServiceMonitor:

```yaml
ports:
  - name: metrics
    containerPort: 8080
```

```yaml
# Service
ports:
  - name: metrics
    port: 8080
    targetPort: metrics
```

The name `metrics` links ServiceMonitor and Service.

## PodMonitor

Analog for scraping **pod IPs directly** (no Service), when metrics exist only on the pod network or hostPort.

## PrometheusRule

CRD for rules (recording/alerting) — analog of files under `config/rules/`. In GitOps they live next to the app:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: demo-slo
spec:
  groups:
    - name: slo
      rules:
        - record: slo:demo_availability:ratio5m
          expr: ...
```

Same expressions as [examples/slo-recording-rules.yml](examples/slo-recording-rules.yml) on the Docker stand.

## Labels and Helm release

In the `kube-prometheus-stack` Helm chart, Prometheus often selects ServiceMonitors by label `release: <helm-release>`. Without the label the monitor **won’t be picked up** — classic “No data in Grafana for app” mistake.

## Loki in k8s

Promtail or **Grafana Agent** / **Alloy** — DaemonSet with pod label discovery. Same LogQL ([03-loki-logql.md](03-loki-logql.md)), labels: `namespace`, `pod`, `container`.

## Kafka in k8s

Strimzi can deploy a **Kafka Exporter** and ServiceMonitor for lag ([kafka-intermediate/17-monitoring.md](../kafka-intermediate/17-monitoring.md), [25-strimzi-k8s.md](../kafka-intermediate/25-strimzi-k8s.md)).

## Mapping: Docker stand ↔ k8s

| Docker (this course) | Kubernetes |
|--------------------|------------|
| `scrape_configs` in prometheus.yml | ServiceMonitor + Operator |
| `config/rules/*.yml` | PrometheusRule CRD |
| Promtail + docker_sd | Promtail/Alloy + kubernetes_sd |
| `alertmanager.yml` | AlertmanagerConfig / secret |

## Checklist

- [ ] Explained why ServiceMonitor instead of static_configs.
- [ ] Know the link between Service `port name` and `endpoints.port`.
- [ ] Understand the Helm `release` label role.
- [ ] Found the stack install in kuber-advanced.

**Next:** [16. Final project](16-final-project.md).
