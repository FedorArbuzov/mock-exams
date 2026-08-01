# 14. Lab: OTel Collector and metric scrape

> **Optional.** You can finish the intermediate course without this lab.

## Goal

Bring up the OTel overlay, add scrape of `otel-collector:8889` in Prometheus, send a test metric over OTLP HTTP, see it in Prometheus/Grafana.

## Setup

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d
docker compose ps
```

Jaeger UI: http://localhost:16686 (for checking traces — optional).

## Task 1. Scrape job

In `config/prometheus.yml` append to `scrape_configs`:

```yaml
  - job_name: otel-collector
    static_configs:
      - targets: ["otel-collector:8889"]
```

```bash
curl -X POST http://localhost:9090/-/reload
```

**Status → Targets** — `otel-collector` **UP**. Query `{job="otel-collector"}` — metrics `otelcol_receiver_*`, `otelcol_exporter_*`.

## Task 2. OTLP HTTP smoke

From the host (needs `curl`):

```bash
curl -s -X POST "http://localhost:4318/v1/metrics" \
  -H "Content-Type: application/json" \
  -d '{
    "resourceMetrics": [{
      "resource": {"attributes": [{"key": "service.name", "value": {"stringValue": "otel-lab"}}]},
      "scopeMetrics": [{
        "metrics": [{
          "name": "lab.requests",
          "sum": {
            "dataPoints": [{
              "asInt": "1",
              "timeUnixNano": "'$(date +%s000000000)'"
            }],
            "aggregationTemporality": 2,
            "isMonotonic": true
          }
        }]
      }]
    }]
  }'
```

*Note:* exact OTLP/JSON is verbose; on 400 use **grpcurl** or a tiny Python script with `opentelemetry-exporter-otlp-proto-http` — the goal is to see the counter grow on `:8889/metrics`.

Simpler check without a custom metric: internal collector metrics after reload are enough.

## Task 3. Grafana

Explore → Prometheus → `otelcol_receiver_accepted_metric_points` (or whatever `/metrics` shows).

Panel: rate of accepted points over 5m — proof the metrics pipeline is alive.

## Task 4. Trace (brief)

```bash
curl -s -X POST "http://localhost:4318/v1/traces" \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}'
```

Or send a trace from Jaeger “Generate” in the UI if available. Goal — open Jaeger and see **at least one** trace path through the collector (`traces` pipeline in config).

## Task 5. Doc “when OTel”

In 5 sentences: for a Python demo-app would you keep `prometheus_client` or adopt the OTel SDK? Arguments.

## Expected result

| Check | Criterion |
|----------|----------|
| Overlay | otel-collector + jaeger running |
| Prometheus | job otel-collector UP |
| Grafana | Panel on otelcol_* |
| Reflection | “when OTel” write-up |

## Troubleshooting

| Symptom | Action |
|---------|----------|
| Target down | Compose network; name `otel-collector:8889` |
| Port 4317 in use | Only one overlay on the host |
| No custom metric | Internal metrics are enough to pass |

## Checklist

- [ ] OTel overlay running
- [ ] Scrape 8889 configured
- [ ] Collector metrics visible in Grafana

**Next:** [15. ServiceMonitor](15-k8s-servicemonitor.md).
