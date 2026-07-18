# 07. Kubecost и аллокация в Kubernetes

## Введение

AWS Cost Explorer видит **EC2 instance ID**, не **namespace checkout**. **Kubecost** (и аналоги: OpenCost, CloudHealth container) связывает **cloud bill** с **Kubernetes objects** через labels и metrics.

---

## Что даёт Kubecost

| Функция | Зачем |
|---------|--------|
| Allocation by namespace/label | showback командам |
| Idle cost | ноды «съедают», Pod не использует |
| Rightsizing recommendations | requests vs usage |
| Asset costs | PV, LB, external IPs |
| Alerts | spend spike по namespace |

Open-source core: **OpenCost** — CNCF; Kubecost — commercial UI/enterprise features.

---

## Архитектура (упрощённо)

```text
Prometheus metrics (cAdvisor/kube-state-metrics)
        +
Cloud billing API / CUR integration (optional on AWS)
        ↓
Kubecost cost-model
        ↓
UI / API / alerts
```

На **mockctl** без AWS billing — **внутрикластерная** аллокация (CPU/RAM share), всё равно полезно для **requests discipline**.

---

## Установка на mockctl (опционально)

```bash
mockctl up
helm repo add kubecost https://kubecost.github.io/cost-analyzer/
helm repo update
helm install kubecost kubecost/cost-analyzer \
  -n kubecost --create-namespace \
  --set kubecostProductConfigs.clusterName=mock-exams
kubectl port-forward -n kubecost svc/kubecost-cost-analyzer 9090:9090
```

UI: `http://localhost:9090` — разделы **Allocation**, **Assets**, **Efficiency**.

**RAM:** +1–2 ГБ к кластеру; на слабом laptop — только читайте теорию.

---

## Labels для allocation

В Kubecost настройте **allocation labels** (пример):

```yaml
# values.yaml fragment
kubecostProductConfigs:
  labelMappingConfigs:
    enabled: true
  commonLabels:
    - team
    - app
    - env
```

Pod **без** `team` → попадает в `__unallocated__` — красный флаг на review.

---

## Requests / limits и cost

Kubecost считает **reserved** cost по requests, **usage** по фактическому consumption:

| Ситуация | Сигнал |
|----------|--------|
| requests >> usage | переплата на планировании |
| no requests | scheduling хаос, плохая аллокация |
| limits << spike | OOMKill, не cost issue |

Связь: [kuber-intermediate resources](../kuber-intermediate/15-resources-qos.md).

---

## OpenCost (кратко)

```bash
kubectl apply -f https://raw.githubusercontent.com/opencost/opencost/develop/kubernetes/opencost.yaml
```

Экспорт метрик в Prometheus/Grafana — если уже есть [observability stack](../../deploy/observability/README.md).

---

## В mock-exams

После установки:

1. `kubectl apply -f deploy/gitops/manifests/hello-gitops/` (если есть workloads).
2. Allocation → by namespace.
3. Найдите **highest cost** deployment; предложите 1 rightsizing action.

---

## Резюме

Kubecost закрывает **слепую зону** K8s в AWS bill. Минимум без SaaS: labels + OpenCost + monthly review allocation table.

---

## Чек-лист

- [ ] Обязательные labels на Pod определены?
- [ ] Понимаете разницу idle vs unallocated?
- [ ] (Опционально) UI Kubecost открывается на mockctl?

**Дальше:** [08. S3, NAT, transfer](08-storage-network-cost.md).
