# 09. Interview Q&A — топ-30 вопросов с ответами

Формат: **вопрос** → **короткий ответ** (30 с) → **deep dive** (2–3 мин). Таблица: [`interview-cheatsheet.md`](interview-cheatsheet.md).

---

## Три столпа и основы

### 1. Что такое observability?

**Коротко:** Способность понять внутреннее состояние системы по **внешним** выходам (metrics, logs, traces), не только заранее известным checks.

**Deep dive:** Отличие от monitoring: отвечаем на **новые** вопросы после deploy; требует instrumentation и correlation.

### 2. Три столпа — чем отличаются?

**Коротко:** Metrics — агрегаты; logs — события; traces — путь запроса.

**Deep dive:** [01](01-otel-traces.md); алерты чаще на metrics; расследование — traces + logs.

### 3. SLI, SLO, SLA?

**Коротко:** SLI — измерение; SLO — цель (99.9%); SLA — контракт с последствиями.

**Deep dive:** Error budget = 1 - SLO; burn rate alerts.

### 4. RED метод?

**Коротко:** Rate, Errors, Duration для сервисов.

**Deep dive:** [07](07-troubleshooting-runbooks.md); USE для nodes.

### 5. USE метод?

**Коротко:** Utilization, Saturation, Errors для ресурсов.

**Deep dive:** CPU throttling, disk queue depth.

---

## Prometheus и метрики

### 6. Pull vs push?

**Коротко:** Prometheus **pull** scrape; pushgateway — исключение (batch jobs).

**Deep dive:** Service discovery в k8s; CloudWatch — push model от AWS.

### 7. Типы метрик Prometheus?

**Коротко:** Counter (monotonic), Gauge, Histogram, Summary.

**Deep dive:** [05](05-cardinality-cost.md); histogram для quantiles.

### 8. Что такое cardinality?

**Коротко:** Число уникальных label combinations = time series.

**Deep dive:** Не класть `user_id` в labels; [06-lab](06-lab-cardinality.md).

### 9. `rate()` vs `increase()`?

**Коротко:** `rate` — per-second average over range; для counters.

**Deep dive:** `increase` для «сколько за час»; нужен range `[5m]`.

### 10. `histogram_quantile` — осторожность?

**Коротко:** Агрегируйте **bucket sums** before quantile across instances.

**Deep dive:** Неверный: quantile по avg of quantiles.

---

## Kubernetes monitoring

### 11. Зачем kube-state-metrics?

**Коротко:** Метрики **объектов** k8s (pod phase, deployment).

**Deep dive:** [03](03-kube-prometheus.md); cAdvisor ≠ pod Ready.

### 12. ServiceMonitor vs PodMonitor?

**Коротко:** ServiceMonitor — через Service endpoints; PodMonitor — напрямую pods.

**Deep dive:** [04-lab](04-lab-servicemonitor.md); label `release` для operator.

### 13. Как алертить OOMKilled?

**Коротко:** `kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}`.

**Deep dive:** [kuber-advanced/15](../kuber-advanced/15-lab-observability.md); fix limits/requests.

### 14. requests vs limits?

**Коротко:** requests — scheduling; limits — cap (OOM if memory).

**Deep dive:** Under-provision → throttle; over-provision → waste.

### 15. HPA на что смотрит?

**Коротко:** Обычно CPU/memory custom metrics; needs metrics adapter.

**Deep dive:** Prometheus adapter / KEDA.

---

## Traces и OTel

### 16. Зачем OpenTelemetry?

**Коротко:** Vendor-neutral SDK + OTLP; один instrumentation.

**Deep dive:** Collector pipelines; [02-lab](02-lab-jaeger.md).

### 17. trace_id vs span_id?

**Коротко:** trace_id — весь запрос; span_id — один шаг; parent links tree.

**Deep dive:** [`otel-span.json`](examples/otel-span.json).

### 18. Зачем sampling?

**Коротко:** Traces дорогие; 100% на high RPS нереально.

**Deep dive:** Head vs tail sampling; keep errors slow.

### 19. W3C traceparent?

**Коротко:** Заголовок propagation между сервисами.

**Deep dive:** Без него — broken traces в mesh/queues.

### 20. Collector vs agent sidecar?

**Коротко:** Collector — central pipeline; sidecar — per pod export.

**Deep dive:** DaemonSet agent + central collector pattern.

---

## Logs, AWS, cost

### 21. Structured logging зачем?

**Коротко:** JSON fields → queryable в Loki/CloudWatch Insights.

**Deep dive:** Include `trace_id`, `level`, `service`.

### 22. CloudWatch metric filter vs native metric?

**Коротко:** Filter — из логов; native — AWS service emits.

**Deep dive:** [aws-intermediate/19](../aws-intermediate/19-cloudwatch.md).

### 23. X-Ray vs Jaeger?

**Коротко:** X-Ray — AWS managed; Jaeger — OSS, OTel backend.

**Deep dive:** Lambda Active tracing; same concepts.

### 24. Как снизить стоимость observability?

**Коротко:** Sampling, retention, cardinality control, tiered storage.

**Deep dive:** [05](05-cardinality-cost.md); recording rules.

### 25. Exemplars?

**Коротко:** Link Prometheus histogram sample → trace.

**Deep dive:** Requires compatible backend + instrumentation.

---

## On-call и design

### 26. Alert fatigue — что делать?

**Коротко:** Fewer alerts, SLO-based, runbooks, inhibition.

**Deep dive:** Every alert actionable; [07](07-troubleshooting-runbooks.md).

### 27. «Monitoring is down» — что первым?

**Коротко:** Synthetic check external; don’t trust broken UI.

**Deep dive:** `up`, blackbox exporter, multi-region.

### 28. Как дебажить Redis в microservice?

**Коротко:** Trace span + Redis INFO/SLOWLOG; not per-key metrics.

**Deep dive:** [redis-intermediate/15](../redis-intermediate/15-monitoring.md).

### 29. Synthetics vs metrics?

**Коротко:** Synthetics — user journey blackbox; metrics — internal.

**Deep dive:** Catch DNS/SSL/CDN issues metrics miss.

### 30. Design observability for 200 services?

**Коротко:** Standards (OTel), shared platforms, tenancy, cost guardrails.

**Deep dive:** [11](11-system-design-observability.md).

---

Практика: [10-lab-mock-interview](10-lab-mock-interview.md).
