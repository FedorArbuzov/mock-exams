# 37. Lab: observability for FastAPI

## Lab goal

Connect the [`deploy/fastapi`](../../deploy/fastapi/README.md) API to the [`deploy/observability`](../../deploy/observability/README.md) stack: scrape `/metrics`, a RED dashboard in Grafana, structured logs (optionally a Loki overlay). Generate traffic and build PromQL from [observability-basic/03-lab-promql](../observability-basic/03-lab-promql.md).

Theory: [36-observability](36-observability.md).

---

## Prerequisites

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/smoke.sh

cd ../fastapi
docker compose up -d --build
curl -s http://localhost:8090/metrics | head -20
```

**4+ GB RAM** for Docker is recommended.

| URL | Service |
|-----|--------|
| http://localhost:9090 | Prometheus |
| http://localhost:3000 | Grafana (`admin` / `admin`) |
| http://localhost:8090/metrics | FastAPI |

---

## Task 1. A scrape job for FastAPI

Add to `deploy/observability/config/prometheus.yml` (or a local override):

```yaml
  - job_name: fastapi-course
    static_configs:
      - targets: ["host.docker.internal:8090"]
    metrics_path: /metrics
```

On Linux without `host.docker.internal` — the host IP (`ip route`) or merge the compose networks.

```bash
curl -X POST http://localhost:9090/-/reload
# Targets → fastapi-course UP
```

**Verification:** Prometheus → Status → Targets → **UP**.

---

## Task 2. Instrumentator on the stand

In `deploy/fastapi/stack/api/requirements.txt`:

```text
prometheus-fastapi-instrumentator>=7.0
```

In `main.py` (keep the existing `/metrics` or replace it):

```python
from prometheus_fastapi_instrumentator import Instrumentator

Instrumentator(
    should_group_status_codes=True,
    excluded_handlers=["/metrics", "/health"],
).instrument(app).expose(app)
```

```bash
cd deploy/fastapi
docker compose up -d --build
curl -s http://localhost:8090/metrics | grep http_request
```

---

## Task 3. RED in Prometheus

Run in the Prometheus UI (http://localhost:9090):

**Rate:**

```promql
sum(rate(http_requests_total{job="fastapi-course"}[5m]))
```

**Errors (5xx):**

```promql
sum(rate(http_requests_total{job="fastapi-course",status=~"5.."}[5m]))
/
sum(rate(http_requests_total{job="fastapi-course"}[5m]))
```

**p95 latency:**

```promql
histogram_quantile(
  0.95,
  sum by (le) (rate(http_request_duration_seconds_bucket{job="fastapi-course"}[5m]))
)
```

Generate traffic:

```bash
for i in $(seq 1 100); do
  curl -s -o /dev/null http://localhost:8090/api/v1/items
  curl -s -o /dev/null http://localhost:8090/api/v1/items/999
done
```

---

## Task 4. Grafana dashboard

1. Grafana → Dashboards → New.
2. Panels: RPS, error rate %, p95 latency.
3. Variable `job` = `fastapi-course`.

Save the JSON locally or a screenshot for the report. Compare with the observability-basic demo-app dashboards.

---

## Task 5. Custom cache metrics

If [29-lab-redis](29-lab-redis.md) is implemented, add:

```python
CACHE_HITS = Counter("cache_hits_total", "Cache hits", ["endpoint"])
CACHE_MISSES = Counter("cache_misses_total", "Cache misses", ["endpoint"])
```

A hit ratio panel:

```promql
sum(rate(cache_hits_total[5m]))
/
(sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))
```

---

## Task 6. Structured logging

```bash
pip install structlog  # in requirements
```

A JSON log on every request (the middleware from [36-observability](36-observability.md)). Verification:

```bash
docker compose logs api | tail -5
```

The fields `request_id`, `status`, `path` should be present.

---

## Task 7. Loki overlay (optional)

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d
```

Grafana → Explore → Loki → `{container="mock-fastapi-api"}` (the label depends on the promtail config).

See [observability-intermediate/06-lab-promtail](../observability-intermediate/06-lab-promtail.md).

---

## Task 8. Alert (tabletop)

Describe in 5 lines a `FastAPIHighLatency` rule for p95 > 500ms over 10 minutes. Where does the notification go in the stand? (Alertmanager :9093)

---

## Submission criteria

| Criterion | Required |
|----------|-------------|
| fastapi target UP | yes |
| 3 RED PromQL queries work | yes |
| Grafana 3 panels | yes |
| Traffic + non-zero RPS | yes |
| structlog or a justification for skipping it | yes |

---

## Troubleshooting

| Symptom | Action |
|---------|----------|
| Target DOWN | firewall, `host.docker.internal`, port 8090 |
| No data | metric names — `http_requests_total` vs `fastapi_http_*` |
| p95 NaN | too little data — more curl, wait for the 5m window |

---

## Relation to CI

The pipeline publishes metrics after deploy — the pattern in [gitlab-basic/08-artifacts-cache](../gitlab-basic/08-artifacts-cache.md). In K8s: a ServiceMonitor ([kuber-advanced/14-observability](../kuber-advanced/14-observability.md)).

---

## Summary

This lab closes the loop **code → /metrics → Prometheus → Grafana**. RED queries are the daily on-call tool. Next — distributed traces [38-opentelemetry](38-opentelemetry.md).

## Checklist

- How do you reload the Prometheus config?
- Why does a 404 increase Errors in RED?
- Where do you look at the API container's logs?
- What would you add to the on-call runbook?

Next lesson: [38-opentelemetry](38-opentelemetry.md).
