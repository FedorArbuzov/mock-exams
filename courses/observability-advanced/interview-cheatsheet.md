# Interview cheatsheet — Observability Advanced

Таблицы для повторения перед собеседованием. Формат: **вопрос → короткий ответ (≈30 с) → deep dive (2–3 мин)**.

Полные развёрнутые главы: [09-interview-qa](09-interview-qa.md). Практика: [10-lab-mock-interview](10-lab-mock-interview.md).

**Стенд:** [`deploy/observability`](../../deploy/observability/README.md) (Jaeger **16686**, OTel overlay) · **K8s:** [`kuber-advanced/14`](../kuber-advanced/14-observability.md) · **Redis:** [`redis-intermediate/15`](../redis-intermediate/15-monitoring.md) · **AWS:** [`aws-intermediate/19`](../aws-intermediate/19-cloudwatch.md)

---

## Основы

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 1 | Observability? | Понимание системы по outputs, новые вопросы | vs monitoring; instrumentation ([01](01-otel-traces.md)) |
| 2 | Три столпа? | Metrics, logs, traces | Алерты metrics; расследование traces+logs |
| 3 | SLI/SLO/SLA? | Измерение / цель / контракт | Error budget, burn alerts |
| 4 | RED? | Rate, Errors, Duration | Services ([07](07-troubleshooting-runbooks.md)) |
| 5 | USE? | Utilization, Saturation, Errors | Nodes, disks |

---

## Prometheus

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 6 | Pull vs push? | Prometheus pull scrape | Pushgateway batch only |
| 7 | Типы метрик? | Counter, Gauge, Histogram, Summary | Histogram quantiles ([05](05-cardinality-cost.md)) |
| 8 | Cardinality? | Уникальные label combos | Нет user_id ([06](06-lab-cardinality.md)) |
| 9 | rate() vs increase()? | rate per-second; increase total | Range `[5m]` обязателен |
| 10 | histogram_quantile? | Aggregate buckets first | Не avg of quantiles |

---

## Kubernetes

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 11 | kube-state-metrics? | k8s object metrics | vs cAdvisor ([03](03-kube-prometheus.md)) |
| 12 | ServiceMonitor? | CRD scrape via Service | labels, port name ([04](04-lab-servicemonitor.md)) |
| 13 | OOMKilled alert? | kube_pod_container_status_last_terminated_reason | [kuber-advanced/15](../kuber-advanced/15-lab-observability.md) |
| 14 | requests vs limits? | Schedule vs cap | OOM, throttle |
| 15 | HPA metrics? | CPU/mem/custom | adapter/KEDA |

---

## Traces / OTel

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 16 | Зачем OTel? | Vendor-neutral OTLP | Collector ([02](02-lab-jaeger.md)) |
| 17 | trace_id vs span_id? | Whole request vs step | Parent tree ([otel-span.json](examples/otel-span.json)) |
| 18 | Sampling? | Cost control | Head/tail; keep errors |
| 19 | traceparent? | W3C propagation header | Broken traces без него |
| 20 | Collector vs sidecar? | Central pipeline vs per-pod | DaemonSet pattern |

---

## Logs, AWS, ops

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 21 | Structured logs? | Queryable JSON fields | trace_id, service |
| 22 | CW filter vs native? | Filter from logs; native from AWS | [19](../aws-intermediate/19-cloudwatch.md) |
| 23 | X-Ray vs Jaeger? | AWS managed vs OSS | Lambda Active tracing |
| 24 | Cost down? | Sampling, retention, cardinality | Recording rules ([05](05-cardinality-cost.md)) |
| 25 | Exemplars? | Metric → trace link | Prometheus 2.x |

---

## Design & on-call

| # | Вопрос | Короткий ответ | Deep dive |
|---|--------|----------------|-----------|
| 26 | Alert fatigue? | SLO alerts, runbooks, inhibition | Actionable only ([07](07-troubleshooting-runbooks.md)) |
| 27 | Monitoring down? | External synthetics | Don't trust broken UI |
| 28 | Debug Redis? | Trace span + INFO/SLOWLOG | No per-key metrics ([redis-intermediate/15](../redis-intermediate/15-monitoring.md)) |
| 29 | Synthetics vs metrics? | Blackbox user journey | DNS/SSL gaps |
| 30 | 200 services design? | OTel standards, platform, guardrails | [11](11-system-design-observability.md) |

---

## Быстрые команды (стенд)

```bash
# Traces stack
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d

# Jaeger UI
# http://localhost:16686

# OTLP trace POST
curl -X POST http://localhost:4318/v1/traces -H "Content-Type: application/json" \
  --data-binary @courses/observability-advanced/examples/otel-span.json

# K8s Grafana
kubectl port-forward svc/kube-prom-grafana -n monitoring 3000:80
```

## PromQL шпаргалка

```promql
# Error ratio
sum(rate(demo_http_requests_total{status=~"5.."}[5m])) / sum(rate(demo_http_requests_total[5m]))
# p99
histogram_quantile(0.99, sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le))
# Target up
up{job="demo-app"}
# Cardinality probe
topk(10, count by (__name__)({__name__=~".+"}))
```
