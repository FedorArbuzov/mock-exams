# 04. Лаба: ServiceMonitor и tabletop k8s metrics

## Цель

Установить **kube-prometheus-stack** (или использовать уже установленный), найти pod metrics в Grafana, оформить **ServiceMonitor** для приложения с `/metrics`, пройти tabletop из [kuber-advanced/14](../kuber-advanced/14-observability.md).

> Требует `mockctl up`, Helm, 4+ ГБ RAM.

## Предварительно

- [03-kube-prometheus](03-kube-prometheus.md).
- [kuber-advanced/14-observability](../kuber-advanced/14-observability.md) — команды install.

---

## Часть A. Tabletop (15 мин, без кластера)

Ответьте письменно:

| # | Вопрос | Ваш ответ |
|---|--------|-----------|
| 1 | Зачем kube-state-metrics, если есть cAdvisor? | |
| 2 | Где смотреть CPU конкретного pod? | |
| 3 | Что такое ServiceMonitor? | |
| 4 | Почему `release: kube-prom` на PrometheusRule? | |
| 5 | Pod OOMKilled — какая метрика из [15-lab](../kuber-advanced/15-lab-observability.md)? | |

**Эталон (проверьте после):**

1. KSM — объекты k8s (phase, desired replicas); cAdvisor — cgroup контейнера.
2. Grafana dashboard **Kubernetes / Compute Resources / Pod** или PromQL `container_cpu_usage_seconds_total`.
3. CRD для scrape приложений через prometheus-operator.
4. Label selector связывает rule с экземпляром Prometheus из chart.
5. `kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}`.

---

## Часть B. Install и port-forward

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

В Grafana: **Explore** → Prometheus → запрос:

```promql
kube_pod_status_phase
```

---

## Часть C. OOM drill (из kuber-advanced/15)

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

## Часть D. ServiceMonitor для demo

Разверните минимальный exporter (nginx prometheus или свой pod):

```bash
kubectl create deployment web --image=nginx --port=80
kubectl expose deployment web --port=80 --name=web
```

Для реального scrape нужен sidecar/exporter с `/metrics`. **Учебный вариант** — ServiceMonitor на **kube-state-metrics** не нужен; создайте Service с **аннотацией** и портом metrics от [demo-app в docker](../../deploy/observability/demo/app.py) перенесённого в k8s, либо используйте шаблон:

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

В Prometheus UI → **Status → Targets** найдите job `serviceMonitor/monitoring/web/0` (имя может отличаться).

**Если target DOWN:** label `release` на ServiceMonitor, имя port, namespaceSelector.

---

## Часть E. Сравнение с Docker-стендом

| Аспект | `deploy/observability` | kube-prometheus-stack |
|--------|------------------------|------------------------|
| Scrape config | `prometheus.yml` static | ServiceMonitor CRD |
| Pod labels | compose service name | k8s labels |
| OOM | cAdvisor / container | kube-state + cgroup |

---

## Критерии успеха

- [ ] Tabletop: ≥4/5 верных ответов
- [ ] Grafana/Prometheus доступны через port-forward
- [ ] OOM pod → метрика terminate reason или restarts
- [ ] ServiceMonitor появился в Targets (или документирована причина DOWN)

## Уборка

```bash
kubectl delete namespace lab-mon --ignore-not-found
helm uninstall kube-prom -n monitoring
kubectl delete namespace monitoring
```

Следующий урок: [05-cardinality-cost.md](05-cardinality-cost.md).
