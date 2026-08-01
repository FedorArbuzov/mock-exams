# 09. Interview Q&A — top 30 questions with answers

Format: **question** → **short answer** (30 s) → **deep dive** (2–3 min). Table: [`interview-cheatsheet.md`](interview-cheatsheet.md).

---

## The three pillars and fundamentals

### 1. What is observability?

**Short:** The ability to understand a system's internal state from its **external** outputs (metrics, logs, traces), not only from predefined checks.

**Deep dive:** The difference from monitoring: we answer **new** questions after a deploy; it requires instrumentation and correlation.

### 2. The three pillars — how do they differ?

**Short:** Metrics are aggregates; logs are events; traces are the request's path.

**Deep dive:** [01](01-otel-traces.md); alerts are more often on metrics; investigation uses traces + logs.

### 3. SLI, SLO, SLA?

**Short:** SLI — a measurement; SLO — a target (99.9%); SLA — a contract with consequences.

**Deep dive:** Error budget = 1 - SLO; burn rate alerts.

### 4. The RED method?

**Short:** Rate, Errors, Duration for services.

**Deep dive:** [07](07-troubleshooting-runbooks.md); USE for nodes.

### 5. The USE method?

**Short:** Utilization, Saturation, Errors for resources.

**Deep dive:** CPU throttling, disk queue depth.

---

## Prometheus and metrics

### 6. Pull vs push?

**Short:** Prometheus **pulls** (scrapes); pushgateway is the exception (batch jobs).

**Deep dive:** Service discovery in k8s; CloudWatch — a push model from AWS.

### 7. Prometheus metric types?

**Short:** Counter (monotonic), Gauge, Histogram, Summary.

**Deep dive:** [05](05-cardinality-cost.md); histogram for quantiles.

### 8. What is cardinality?

**Short:** The number of unique label combinations = time series.

**Deep dive:** Don't put `user_id` in labels; [06-lab](06-lab-cardinality.md).

### 9. `rate()` vs `increase()`?

**Short:** `rate` — per-second average over a range; for counters.

**Deep dive:** `increase` for "how much over an hour"; needs a range `[5m]`.

### 10. `histogram_quantile` — what to watch out for?

**Short:** Aggregate the **bucket sums** before the quantile across instances.

**Deep dive:** Wrong: a quantile over the average of quantiles.

---

## Kubernetes monitoring

### 11. Why kube-state-metrics?

**Short:** Metrics of k8s **objects** (pod phase, deployment).

**Deep dive:** [03](03-kube-prometheus.md); cAdvisor ≠ pod Ready.

### 12. ServiceMonitor vs PodMonitor?

**Short:** ServiceMonitor — via Service endpoints; PodMonitor — pods directly.

**Deep dive:** [04-lab](04-lab-servicemonitor.md); the `release` label for the operator.

### 13. How do you alert on OOMKilled?

**Short:** `kube_pod_container_status_last_terminated_reason{reason="OOMKilled"}`.

**Deep dive:** [kuber-advanced/15](../kuber-advanced/15-lab-observability.md); fix limits/requests.

### 14. requests vs limits?

**Short:** requests — scheduling; limits — the cap (OOM if memory).

**Deep dive:** Under-provision → throttle; over-provision → waste.

### 15. What does the HPA look at?

**Short:** Usually CPU/memory or custom metrics; needs a metrics adapter.

**Deep dive:** Prometheus adapter / KEDA.

---

## Traces and OTel

### 16. Why OpenTelemetry?

**Short:** Vendor-neutral SDK + OTLP; one instrumentation.

**Deep dive:** Collector pipelines; [02-lab](02-lab-jaeger.md).

### 17. trace_id vs span_id?

**Short:** trace_id — the whole request; span_id — one step; the parent links the tree.

**Deep dive:** [`otel-span.json`](examples/otel-span.json).

### 18. Why sampling?

**Short:** Traces are expensive; 100% at high RPS is unrealistic.

**Deep dive:** Head vs tail sampling; keep errors and slow requests.

### 19. W3C traceparent?

**Short:** The propagation header between services.

**Deep dive:** Without it — broken traces in a mesh/queues.

### 20. Collector vs agent sidecar?

**Short:** Collector — a central pipeline; sidecar — per-pod export.

**Deep dive:** DaemonSet agent + central collector pattern.

---

## Logs, AWS, cost

### 21. Why structured logging?

**Short:** JSON fields → queryable in Loki/CloudWatch Insights.

**Deep dive:** Include `trace_id`, `level`, `service`.

### 22. CloudWatch metric filter vs native metric?

**Short:** Filter — from logs; native — emitted by the AWS service.

**Deep dive:** [aws-intermediate/19](../aws-intermediate/19-cloudwatch.md).

### 23. X-Ray vs Jaeger?

**Short:** X-Ray — AWS managed; Jaeger — OSS, an OTel backend.

**Deep dive:** Lambda Active tracing; same concepts.

### 24. How do you reduce observability cost?

**Short:** Sampling, retention, cardinality control, tiered storage.

**Deep dive:** [05](05-cardinality-cost.md); recording rules.

### 25. Exemplars?

**Short:** Link a Prometheus histogram sample → a trace.

**Deep dive:** Requires a compatible backend + instrumentation.

---

## On-call and design

### 26. Alert fatigue — what do you do?

**Short:** Fewer alerts, SLO-based, runbooks, inhibition.

**Deep dive:** Every alert actionable; [07](07-troubleshooting-runbooks.md).

### 27. "Monitoring is down" — what first?

**Short:** An external synthetic check; don't trust a broken UI.

**Deep dive:** `up`, blackbox exporter, multi-region.

### 28. How do you debug Redis in a microservice?

**Short:** Trace span + Redis INFO/SLOWLOG; not per-key metrics.

**Deep dive:** [redis-intermediate/15](../redis-intermediate/15-monitoring.md).

### 29. Synthetics vs metrics?

**Short:** Synthetics — a blackbox user journey; metrics — internal.

**Deep dive:** Catch DNS/SSL/CDN issues that metrics miss.

### 30. Design observability for 200 services?

**Short:** Standards (OTel), shared platforms, tenancy, cost guardrails.

**Deep dive:** [11](11-system-design-observability.md).

---

Practice: [10-lab-mock-interview](10-lab-mock-interview.md).
