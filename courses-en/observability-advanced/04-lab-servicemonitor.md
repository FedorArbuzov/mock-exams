# 04. Lab: ServiceMonitor and k8s metrics tabletop

## Goal

Install **kube-prometheus-stack** (or use an existing installation), find pod metrics in Grafana, write a **ServiceMonitor** for an application with `/metrics`, and go through the tabletop from [kuber-advanced/14](../kuber-advanced/14-observability.md).

> Requires `mockctl up`, Helm, 4+ GB RAM.

## Prerequisites

- [03-kube-prometheus](03-kube-prometheus.md).
- [kuber-advanced/14-observability](../kuber-advanced/14-observability.md) — install commands.

---

## Part A. Tabletop (15 min, no cluster)

Answer in writing:

| # | Question | Your answer |
|---|--------|-----------|
| 1 | Why kube-state-metrics if there's cAdvisor? | |
| 2 | Where do you look at the CPU of a specific pod? | |
| 3 | What is a ServiceMonitor? | |
| 4 | Why `release: kube-prom` on a PrometheusRule? | |
| 5 | Pod OOMKilled — which metric from [15-lab](../kuber-advanced/15-lab-observability.md)? | |

**Reference (check afterwards):**

1. KSM — k8s objects (phase, desired replicas); cAdvisor — the container cgroup.
2. Grafana dashboard **Kubernetes / Compute Resources / Pod** or PromQL `container_cpu_usage_seconds_total`.
3. A CRD for scraping applications via prometheus-operator.
4. The label selector links the rule to the Prometheus instance from the chart.
5. `kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}`.

---

## Part B. Install and port-forward

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install kube-prom prometheus-community/kube-prometheus-stack \
  -n monitoring --create-namespace \
  --set grafana.adminPassword=admin \
  --set prometheus.prometheusSpec.retention=2d \
  --set prometheus.prometheusSpec.resources.requests.memory=512Mi
```

```bash
kubectl port-forward svc/kube-prom-grafana -n monitoring 3000:80
kubectl port-forward svc/kube-prom-kube-prometheus-prometheus -n monitoring 9090:9090
```

In Grafana: **Explore** → Prometheus → query:

```promql
kube_pod_status_phase
```

---

## Part C. OOM drill (from kuber-advanced/15)

```bash
kubectl create namespace lab-mon
kubectl run oom -n lab-mon --image=polinux/stress \
  --overrides='{"spec":{"containers":[{"name":"c","image":"polinux/stress","command":["stress","--vm","1","--vm-bytes","250M"],"resources":{"limits":{"memory":"128Mi"}}}]}}'
kubectl get pod oom -n lab-mon -w
```

PromQL:

```promql
kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}
increase(kube_pod_container_status_restarts_total[5m]) > 0
```

---

## Part D. ServiceMonitor for a demo

Deploy a minimal exporter (nginx prometheus or your own pod):

```bash
kubectl create deployment web --image=nginx --port=80
kubectl expose deployment web --port=80 --name=web
```

For a real scrape you need a sidecar/exporter with `/metrics`. In the **learning version**, a ServiceMonitor on **kube-state-metrics** isn't needed; create a Service with an **annotation** and a metrics port from the [demo-app in docker](../../deploy/observability/demo/app.py) ported to k8s, or use the template:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-metrics
  labels:
    app: web
spec:
  selector:
    app: web
  ports:
    - name: metrics
      port: 9113
      targetPort: 9113
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: web
  namespace: monitoring
  labels:
    release: kube-prom
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
```

In the Prometheus UI → **Status → Targets** find the job `serviceMonitor/monitoring/web/0` (the name may differ).

**If the target is DOWN:** the `release` label on the ServiceMonitor, the port name, the namespaceSelector.

---

## Part E. Comparison with the Docker stack

| Aspect | `deploy/observability` | kube-prometheus-stack |
|--------|------------------------|------------------------|
| Scrape config | `prometheus.yml` static | ServiceMonitor CRD |
| Pod labels | compose service name | k8s labels |
| OOM | cAdvisor / container | kube-state + cgroup |

---

## Success criteria

- [ ] Tabletop: ≥4/5 correct answers
- [ ] Grafana/Prometheus reachable via port-forward
- [ ] OOM pod → terminate reason or restarts metric
- [ ] ServiceMonitor appeared in Targets (or the reason for DOWN is documented)

## Cleanup

```bash
kubectl delete namespace lab-mon --ignore-not-found
helm uninstall kube-prom -n monitoring
kubectl delete namespace monitoring
```

Next lesson: [05-cardinality-cost.md](05-cardinality-cost.md).
