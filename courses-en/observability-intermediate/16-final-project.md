# 16. Final project: observability for the demo service

## Goal

Assemble a **minimal production-like** observability loop around `deploy/observability` demo-app: metrics (recording + SLO), logs (Loki), alerts (routing), a dashboard, and a short runbook. Optionally — OTel overlay.

Estimate: **4–6 hours** of independent work.

## Requirements

### 1. Infrastructure

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d --build
bash scripts/smoke.sh
```

Optional: `-f docker-compose.otel.yml`.

### 2. Metrics and SLO

- Recording rules: RPS, error ratio, **p95 latency** (see [02](02-lab-recording.md), [08](08-lab-error-budget.md), [12](12-lab-histogram.md)).
- Rules file based on [examples/slo-recording-rules.yml](examples/slo-recording-rules.yml).
- Doc `docs/slo-demo-app.md`:
  - SLI (availability + latency),
  - SLO target and window,
  - error budget policy (2–3 sentences).

### 3. Alerts

At least **three** alerting rules:

| Alert | Condition (idea) | severity |
|-------|----------------|----------|
| Target down | `up{job="demo-app"}==0` | critical |
| High error rate | 5xx ratio > threshold | warning |
| SLO burn / latency | availability or p95 | warning or critical |

Alertmanager: **two** receivers (e.g. `critical` / `warning`), **one** inhibit rule ([10-lab-routing.md](10-lab-routing.md)).

### 4. Logs

- Promtail pipeline: `docker` stage + extract at least one **low**-cardinality field into a label ([06-lab-promtail.md](06-lab-promtail.md)).
- Extend [examples/logql-queries.txt](examples/logql-queries.txt) with **5 of your own** queries plus a “why” comment.
- A **Logs** panel on the dashboard correlated in time with the error metric.

### 5. Grafana dashboard

One dashboard `Demo Platform` with rows:

1. Availability (SLO recording).
2. RPS and error ratio.
3. p95 latency (heatmap or stat).
4. Logs panel (Loki).
5. *(Opt.)* OTel collector health.

Export JSON to `deploy/observability/config/grafana/provisioning/dashboards/json/demo-platform.json` **or** attach `dashboard-demo-platform.json` to the report.

### 6. Runbook (1 page)

`docs/runbook-demo-high-errors.md`:

1. Symptom (which alert).
2. Checks (PromQL + LogQL + `docker compose ps`).
3. Actions (restart, traffic, escalate).
4. Link to the Kafka lag runbook if you also have Kafka up — [18-lab-lag-drill.md](../kafka-intermediate/18-lab-lag-drill.md).

### 7. *Optional* Kubernetes

If you’re taking [kuber-advanced](../kuber-advanced/README.md): ServiceMonitor on a training app + one PrometheusRule with recording `slo:*` — describe in the report with a Targets screenshot.

## Submission (checklist)

- [ ] `docker compose ps` — all needed services healthy
- [ ] Prometheus Rules — all groups green
- [ ] Alertmanager — test firing + resolve documented
- [ ] Grafana dashboard — 4+ panels
- [ ] `docs/slo-demo-app.md` + `docs/runbook-demo-high-errors.md`
- [ ] Extended `examples/logql-queries.txt` (5 queries)
- [ ] Short report `REPORT.md`: what you did, what you’d improve in production

## Quality criteria

| Level | Signs |
|---------|----------|
| Basic | Metrics + one alert + Loki Explore |
| Intermediate | SLO recording, routing, dashboard, runbook |
| Strong | Inhibit, p95 SLO, pipeline labels justified, Kafka/k8s link in the report |

## Cleanup

```bash
docker compose -f docker-compose.yml -f docker-compose.logs.yml down -v
```

## Next

- [observability-advanced](../observability-advanced/README.md) — traces, triad correlation, advanced burn-rate.
- [kuber-advanced/14-observability.md](../kuber-advanced/14-observability.md) — full stack in the cluster.
- [kafka-intermediate/17-monitoring.md](../kafka-intermediate/17-monitoring.md) — stream monitoring.

Congratulations on finishing **observability-intermediate**.
