# Observability — Advanced

Advanced level for **interviews** and **on-call**: **distributed tracing** (OpenTelemetry, Jaeger), **Kubernetes monitoring** (kube-prometheus-stack, ServiceMonitor), **cardinality and cost**, **runbooks**, **mock interview**, **system design** of an observability platform, and an **on-call capstone**.

**Prerequisites:** basic metrics/alerts (courses `observability-basic` / `observability-intermediate`, if present in the repository) or hands-on practice with Prometheus/Grafana. Useful: [`kuber-advanced/14`](../kuber-advanced/14-observability.md), [`aws-intermediate/19`](../aws-intermediate/19-cloudwatch.md).

**Locally (Docker):** [`deploy/observability`](../../deploy/observability/README.md) — Prometheus, Grafana, Alertmanager, demo-app. **Overlay traces:** `docker-compose.otel.yml` → Jaeger UI **16686**.

**Kubernetes (optional, 4+ GB RAM):** `mockctl up` + **kube-prometheus-stack** — as in [kuber-advanced/14](../kuber-advanced/14-observability.md).

| Stack | Command | UI |
|-------|---------|-----|
| Basic | `cd deploy/observability && docker compose up -d --build` | Grafana `3000`, Prometheus `9090` |
| + Traces | `docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d` | Jaeger `16686` |
| K8s | `helm install kube-prom ...` (see 03) | `kubectl port-forward` Grafana/Prometheus |

Before switching stacks: `docker compose down -v` — otherwise you get a port conflict.

## How to read the chapters

Each lesson is a **book chapter** for interview prep, not a dry cheatsheet.

1. **Theory** (01, 03, 05…) — a work scenario → concepts → stack/commands → common mistakes → "at the interview" → summary.
2. **Lab** (02, 04, 06…) — goal → prerequisites → tasks → "what you'll see" / "if it doesn't work" → success criteria.
3. After blocks 09–10 — go through [`interview-cheatsheet.md`](interview-cheatsheet.md) without peeking at the answers.

**Time:** ~60–90 minutes per "theory + lab" pair; [capstone](13-on-call-capstone.md) — **4–6 hours**.

## Curriculum

### Traces and OTel (01–02)

| # | Lesson |
|---|------|
| 01 | [OpenTelemetry and traces](01-otel-traces.md) |
| 02 | [Lab: Jaeger and OTLP](02-lab-jaeger.md) |

### Kubernetes metrics (03–04)

| 03 | [kube-prometheus-stack](03-kube-prometheus.md) |
| 04 | [Lab: ServiceMonitor](04-lab-servicemonitor.md) |

### Cost and cardinality (05–06)

| 05 | [Cardinality and cost](05-cardinality-cost.md) |
| 06 | [Lab: cardinality](06-lab-cardinality.md) |

### On-call (07–08)

| 07 | [Troubleshooting and runbooks](07-troubleshooting-runbooks.md) |
| 08 | [Lab: on-call drill](08-lab-oncall-drill.md) |

### Interview (09–10)

| 09 | [Interview Q&A (top 30)](09-interview-qa.md) |
| 10 | [Lab: mock interview](10-lab-mock-interview.md) |

### System design (11–12)

| 11 | [System design: observability](11-system-design-observability.md) |
| 12 | [Lab: system design](12-lab-system-design.md) |

### Capstone

| 13 | [On-call capstone](13-on-call-capstone.md) |

### Cheatsheet and examples

| — | [Interview cheatsheet](interview-cheatsheet.md) |
| — | [examples/runbook-template.md](examples/runbook-template.md) |
| — | [examples/otel-span.json](examples/otel-span.json) |

## What you should end up with

- You can explain the **three pillars** (metrics, logs, traces) and when to use each.
- You configure **OTLP → Collector → Jaeger** and read a **trace** (spans, parent/child, attributes).
- You install **kube-prometheus-stack** and write a **ServiceMonitor** / **PrometheusRule**.
- You assess **cardinality** and storage cost; you avoid `user_id` in labels.
- You maintain a **runbook** based on RED/USE; you correlate metrics, logs, and traces.
- You answer the **system design** question "observability for 200 microservices" with trade-offs.
- You connect the stack to **Redis monitoring** and **CloudWatch** in hybrid setups.

## Related courses

| Course | Relation |
|------|-------|
| [`kuber-advanced/14`](../kuber-advanced/14-observability.md) | Helm install, port-forward, basic metrics |
| [`kuber-advanced/15`](../kuber-advanced/15-lab-observability.md) | OOMKilled, PromQL in the cluster |
| [`redis-intermediate/15`](../redis-intermediate/15-monitoring.md) | INFO, SLOWLOG, exporter — datastore metrics |
| [`redis-advanced/09`](../redis-advanced/09-troubleshooting.md) | Runbook-style diagnostics |
| [`aws-intermediate/19`](../aws-intermediate/19-cloudwatch.md) | Logs, metric filters, alarms, X-Ray |
| [`aws-intermediate/20`](../aws-intermediate/20-lab-cloudwatch.md) | Lab: alarms on Lambda/DLQ |
| [`linux-advanced/23`](../linux-advanced/23-capacity-runbooks.md) | Capacity and runbooks on the host |
