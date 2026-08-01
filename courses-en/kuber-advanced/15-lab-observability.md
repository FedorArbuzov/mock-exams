# 15. Lab: an alert on OOMKilled

> See installation in [14-observability.md](14-observability.md). After install:

## Task 1. Find the pod in Grafana

Dashboard: **Kubernetes / Compute Resources / Pod** — CPU/Memory by namespace.

## Task 2. Trigger OOMKilled

```bash
kubectl create namespace lab-mon
kubectl run oom -n lab-mon --image=polinux/stress \
  --overrides='{"spec":{"containers":[{"name":"c","image":"polinux/stress","command":["stress","--vm","1","--vm-bytes","250M"],"resources":{"limits":{"memory":"128Mi"}}}]}}'
kubectl get pod oom -n lab-mon -w
```

## Task 3. PromQL

In Prometheus (http://localhost:9090):

```promql
kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}
increase(kube_pod_container_status_restarts_total[5m]) > 0
```

## Task 4. (Optional) PrometheusRule

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: oom-alert
  namespace: monitoring
  labels:
    release: kube-prom
spec:
  groups:
    - name: oom
      rules:
        - alert: PodOOMKilled
          expr: kube_pod_container_status_last_terminated_reason{reason="OOMKilled"} > 0
          for: 1m
          labels:
            severity: warning
          annotations:
            summary: "Pod {{ $labels.pod }} OOMKilled"
```

## Cleanup

```bash
helm uninstall kube-prom -n monitoring
kubectl delete namespace monitoring lab-mon
```
