# 12. Лаба: system design observability

## Цель

Оформить **1–2 страницы** design doc по шаблону staff-интервью; peer review по rubric.

## Предварительно

- [11-system-design-observability](11-system-design-observability.md)
- Пройден [10-lab-mock-interview](10-lab-mock-interview.md) (желательно)

---

## Выберите промпт (один)

### A. Fintech payments

99.99% SLO, PCI — no PAN in logs, EU region, EKS + Lambda authorizer.

### B. Gaming realtime

50k RPS, latency p99 < 100ms, Redis sessions, traces heavy — sampling strategy?

### C. Internal platform

200 services, 20 teams, limited SRE, must use existing CloudWatch.

---

## Структура документа

Создайте `my-observability-design.md` (локально, не коммит обязателен):

### 1. Requirements (½ стр)

- 3 SLI / 2 SLO
- Compliance / retention

### 2. Diagram (½ стр)

Mermaid или ASCII: apps → OTel → backends → alerting → on-call.

### 3. Metrics plan (½ стр)

- RED per service
- 5 **allowed** labels
- 3 **forbidden** labels

### 4. Logs & traces (½ стр)

- Log schema (поля)
- Sampling % head + tail rule
- `trace_id` correlation

### 5. K8s & AWS (½ стр)

- kube-prometheus-stack role ([03](03-kube-prometheus.md))
- CloudWatch для Lambda ([19](../aws-intermediate/19-cloudwatch.md)) — что именно

### 6. Redis / datastore (¼ стр)

- 2 alerts, 2 debug commands из [redis-intermediate/15](../redis-intermediate/15-monitoring.md)

### 7. Cost & risks (¼ стр)

- 3 cost knobs
- 2 failure modes + mitigation

---

## Rubric (self-score / peer)

| Критерий | 0 | 1 | 2 |
|----------|---|---|---|
| SLO measurable | Нет | Есть без SLI | SLI+SLO+budget |
| Cardinality | Игнор | Упомянут | Denylist + relabel |
| Traces | «Jaeger» | + sampling | + propagation/async |
| On-call | «Alerts» | AM/CW | Runbooks + severity |
| Hybrid AWS | Только k8s | CW logs | CW alarms + EKS metrics |
| Redis | Нет | Метрики | INFO/SLOWLOG + trace |

**Pass:** ≥9/12.

---

## Эталонные тезисы (не копировать слепо)

- OTel Collector central + DaemonSet agent
- Prometheus HA 2 replicas + Thanos/Mimir optional
- Alertmanager → PagerDuty; CW → SNS для Lambda
- 1% head sampling + tail on `status=error` or `duration>p99`
- Runbook URL в каждом alert annotation

---

## Критерии успеха

- [ ] Документ по структуре 1–7
- [ ] Self-score ≥9/12
- [ ] Peer review: 1 замечание исправлено

Следующий урок: [13-on-call-capstone.md](13-on-call-capstone.md).
