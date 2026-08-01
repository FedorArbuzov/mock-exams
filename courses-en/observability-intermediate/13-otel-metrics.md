# 13. OpenTelemetry: metrics via Collector

> **Optional** chapter. Requires overlay `docker-compose.otel.yml` and ~1 GB RAM beyond the base stack.

## Why OTel if you already have a Prometheus client

| Approach | Pro | Con |
|--------|------|-------|
| `prometheus_client` in the app | Simple, direct scrape | Tied to Prometheus format |
| **OpenTelemetry SDK** | One SDK → traces + metrics + logs | More complex config |
| **OTel Collector** | Accept OTLP, fan-out to Jaeger/Prometheus/vendor | Another component |

In a microservices environment OTel is the **standard** layer: the app sends OTLP, the Collector routes.

## Components on the stand

```bash
docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d
```

| Service | Role |
|--------|------|
| **otel-collector** | Receivers → processors → exporters |
| **jaeger** | Trace UI (advanced) |
| **prometheus** | Scrape `:8889` (Collector Prometheus exporter) |

Config: `deploy/observability/config/otel-collector.yml`:

```yaml
receivers:
  otlp:
    protocols:
      grpc: { endpoint: 0.0.0.0:4317 }
      http: { endpoint: 0.0.0.0:4318 }

exporters:
  prometheus:
    endpoint: 0.0.0.0:8889
  otlp/jaeger:
    endpoint: jaeger:4317

service:
  pipelines:
    metrics:
      receivers: [otlp]
      processors: [batch]
      exporters: [prometheus, debug]
    traces:
      receivers: [otlp]
      exporters: [otlp/jaeger, debug]
```

OTLP metrics become **Prometheus exposition format** on port **8889** inside the compose network.

## Wiring Prometheus

Add a job (manually in `prometheus.yml` or merge `config/prometheus-otel.yml`):

```yaml
  - job_name: otel-collector
    static_configs:
      - targets: ["otel-collector:8889"]
```

Reload Prometheus. Target **UP** — Targets will show metrics like `otelcol_*` and metrics from an instrumented app after the lab.

## OTel data model

- **Meter** → instruments (Counter, Histogram, …).
- Names and attributes map to Prometheus labels on export.
- **Resource attributes** (`service.name`) → labels on all service metrics.

## OTLP endpoints

| Protocol | Port (stand) |
|----------|----------------|
| gRPC | 4317 |
| HTTP | 4318 |

Client (SDK) → `http://localhost:4318/v1/metrics` (from host) or `otel-collector:4317` from another container.

## Metrics vs traces

This chapter focuses on the **metrics pipeline**. Traces go to Jaeger — full correlation in [observability-advanced](../observability-advanced/README.md).

## When not to add complexity

- One monolith, one language, Prometheus native — a client library is enough.
- Platform requires OTLP (Grafana Cloud, Datadog agent) — Collector is mandatory.

## Related to Kubernetes

In k8s the Collector is often a DaemonSet + sidecar; scrape a ServiceMonitor on collector metrics — see [15-k8s-servicemonitor.md](15-k8s-servicemonitor.md) and [kuber-advanced/14-observability.md](../kuber-advanced/14-observability.md).

## Checklist

- [ ] Understand the Collector’s role between app and Prometheus.
- [ ] Know OTLP ports and Prometheus exporter 8889.
- [ ] Distinguish metrics and traces pipelines in the config.

**Next:** [14. Lab: OTel Collector](14-lab-otel-collector.md).
