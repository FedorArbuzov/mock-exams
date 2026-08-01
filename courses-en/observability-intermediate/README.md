# Observability — intermediate

Intermediate course on **observability** with the Prometheus / Grafana / Alertmanager stack, extended with **logs** (Loki, Promtail) and an introduction to **SLOs**, **alert routing**, **histograms**, **OpenTelemetry**, and the **Kubernetes ServiceMonitor** integration.

Format — “book-style” chapters in English: theory → lab on a local stand.

## Who it's for

- Completed [observability-basic](../observability-basic/README.md) (or equivalent: PromQL, scrape, basic alerts).
- Can read application metrics and understand the difference between **metrics / logs / traces**.
- Ready to work with Docker Compose **4+ GB RAM**.

## Stand

All labs rely on this repository:

| Mode | Command |
|-------|---------|
| Base (metrics) | `cd deploy/observability && docker compose up -d --build` |
| + logs | `docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d` |
| + OTel (opt.) | `docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d` |

Details: [deploy/observability/README.md](../../deploy/observability/README.md).

| Service | URL / port |
|--------|------------|
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3000 (`admin` / `admin`) |
| Alertmanager | http://localhost:9093 |
| demo-app | http://localhost:8000 (`/metrics`) |
| Loki (overlay) | http://localhost:3100 |
| Jaeger (OTel overlay) | http://localhost:16686 |

Smoke and load:

```bash
bash deploy/observability/scripts/smoke.sh
bash deploy/observability/scripts/traffic.sh
```

## Related courses

- **Kafka:** lag and broker-metric monitoring — [kafka-intermediate/17-monitoring.md](../kafka-intermediate/17-monitoring.md); lag lab — [18-lab-lag-drill.md](../kafka-intermediate/18-lab-lag-drill.md).
- **Kubernetes:** kube-prometheus-stack and ServiceMonitor — [kuber-advanced/14-observability.md](../kuber-advanced/14-observability.md).

## Curriculum

| # | Theory | Lab |
|---|--------|------|
| 01 | [Recording rules](01-recording-rules.md) | [02](02-lab-recording.md) |
| 03 | [Loki and LogQL](03-loki-logql.md) | [04](04-lab-loki.md) |
| 05 | [Promtail pipelines](05-promtail-pipelines.md) | [06](06-lab-promtail.md) |
| 07 | [SLO, SLI, SLA](07-slo-sli-sla.md) | [08](08-lab-error-budget.md) |
| 09 | [Alertmanager routing](09-alertmanager-routing.md) | [10](10-lab-routing.md) |
| 11 | [Histograms and quantiles](11-histograms-quantiles.md) | [12](12-lab-histogram.md) |
| 13 | [OTel metrics](13-otel-metrics.md) | [14](14-lab-otel-collector.md) *(opt. overlay)* |
| 15 | [ServiceMonitor in k8s](15-k8s-servicemonitor.md) | — |
| 16 | [Final project](16-final-project.md) | — |

Copy-paste examples: [examples/logql-queries.txt](examples/logql-queries.txt), [examples/slo-recording-rules.yml](examples/slo-recording-rules.yml).

## Time estimate

| Block | Hours |
|------|------|
| Metrics (01–02, 11–12) | 3–4 |
| Logs (03–06) | 4–5 |
| SLOs and alerts (07–10) | 4–5 |
| OTel (13–14, opt.) | 2–3 |
| K8s theory + finale (15–16) | 3–4 |
| **Total** | **~16–21 h** |

## Graduate checklist

- [ ] Write **recording rules** and explain why dashboards and alerts need them.
- [ ] Build **LogQL** queries in Grafana Explore and tie a log to a metric via `trace_id` / labels.
- [ ] Configure a **Promtail pipeline** (parse, labels, drop).
- [ ] Define **SLI/SLO**, compute **error budget**, write recording rules for availability.
- [ ] Configure **Alertmanager routing** (severity, inhibit, group).
- [ ] Read a **histogram** and compute p95 via `histogram_quantile`.
- [ ] *(Opt.)* Ingest metrics through the **OTel Collector** and scrape `:8889`.
- [ ] Understand **ServiceMonitor** in a cluster with prometheus-operator.

## Next

- [observability-advanced](../observability-advanced/README.md) — traces, correlation, advanced Alertmanager, full k8s stack.
