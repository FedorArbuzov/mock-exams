# 15. ServiceMonitor: метрики приложений в Kubernetes

> **Теория.** Лабораторная установка kube-prometheus-stack — в [kuber-advanced/14-observability.md](../kuber-advanced/14-observability.md) и [15-lab-observability.md](../kuber-advanced/15-lab-observability.md). Локальный Docker-стенд этого курса **не заменяет** k8s, но даёт те же концепции PromQL и алертов.

## Проблема

В кластере десятки сервисов с `/metrics` на разных портах. Руками прописывать каждый target в `prometheus.yml` нельзя — pod'ы эфемерны.

**prometheus-operator** (часть **kube-prometheus-stack**) вводит CRD, которые описывают **как** scrape'ить приложения декларативно.

## kube-prometheus-stack (напоминание)

| Компонент | Роль |
|-----------|------|
| Prometheus Operator | Reconcile Prometheus, rules, monitors |
| Prometheus | TSDB |
| Alertmanager | Маршрутизация |
| Grafana | Дашборды |
| node-exporter | Метрики нод |
| kube-state-metrics | Метрики объектов API (pod phase, deployments) |

Установка и port-forward — в [kuber-advanced/14-observability.md](../kuber-advanced/14-observability.md).

## ServiceMonitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: demo-app
  namespace: monitoring
  labels:
    release: kube-prom    # часто нужен для selector Prometheus CR
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

Operator генерирует scrape config:

- находит `Service` с `matchLabels`;
- читает имена портов из `endpoints[].port`;
- добавляет targets в Prometheus без правки ConfigMap вручную.

## Service: порт metrics

Deployment должен экспонировать порт с **именем**, совпадающим с ServiceMonitor:

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

Имя `metrics` связывает ServiceMonitor и Service.

## PodMonitor

Аналог для scrape **напрямую pod IP** (без Service), когда метрики только на pod network или hostPort.

## PrometheusRule

CRD для правил (recording/alerting) — аналог файлов в `config/rules/`. В GitOps хранятся рядом с приложением:

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

Те же выражения, что в [examples/slo-recording-rules.yml](examples/slo-recording-rules.yml) на Docker-стенде.

## Labels и Helm release

В Helm chart `kube-prometheus-stack` Prometheus часто выбирает ServiceMonitor по label `release: <helm-release>`. Без label monitor **не подхватится** — типичная ошибка «No data в Grafana для app».

## Loki в k8s

Promtail или **Grafana Agent** / **Alloy** — DaemonSet с discovery pod labels. LogQL те же ([03-loki-logql.md](03-loki-logql.md)), labels: `namespace`, `pod`, `container`.

## Kafka в k8s

Strimzi может разворачивать **Kafka Exporter** и ServiceMonitor для lag ([kafka-intermediate/17-monitoring.md](../kafka-intermediate/17-monitoring.md), [25-strimzi-k8s.md](../kafka-intermediate/25-strimzi-k8s.md)).

## Сопоставление: Docker-стенд ↔ k8s

| Docker (этот курс) | Kubernetes |
|--------------------|------------|
| `scrape_configs` в prometheus.yml | ServiceMonitor + Operator |
| `config/rules/*.yml` | PrometheusRule CRD |
| Promtail + docker_sd | Promtail/Alloy + kubernetes_sd |
| `alertmanager.yml` | AlertmanagerConfig / secret |

## Чек-лист

- [ ] Объяснили, зачем ServiceMonitor вместо static_configs.
- [ ] Знаете связь `port name` в Service и `endpoints.port`.
- [ ] Понимаете роль label `release` у Helm.
- [ ] Нашли установку стека в kuber-advanced.

**Дальше:** [16. Финальный проект](16-final-project.md).
