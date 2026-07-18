# 15. Лаба: алерт на OOMKilled

> См. установку в [14-observability.md](14-observability.md). После install:

## Задание 1. Найти pod в Grafana

Dashboard: **Kubernetes / Compute Resources / Pod** — CPU/Memory по namespace.

## Задание 2. Вызвать OOMKilled

```bash
kubectl create namespace lab-mon
kubectl run oom -n lab-mon --image=polinux/stress \
  --overrides='{"spec":{"containers":[{"name":"c","image":"polinux/stress","command":["stress","--vm","1","--vm-bytes","250M"],"resources":{"limits":{"memory":"128Mi"}}}]}}'
kubectl get pod oom -n lab-mon -w
```

## Задание 3. PromQL

В Prometheus (http://localhost:9090):

```promql
kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}
increase(kube_pod_container_status_restarts_total[5m]) > 0
```

## Задание 4. (Опционально) PrometheusRule

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

## Уборка

```bash
helm uninstall kube-prom -n monitoring
kubectl delete namespace monitoring lab-mon
```
