# 01. Recording rules: precomputed metrics

## Why this matters

In production, dashboards and alerts often rely on the same heavy PromQL expressions:

```promql
sum(rate(http_requests_total{status=~"5.."}[5m]))
/
sum(rate(http_requests_total[5m]))
```

Every time you open Grafana, Prometheus recomputes aggregates across all series. With thousands of `pod` × `status` × `path`, the query gets expensive — and with a cardinality spike, unstable too.

**Recording rules** are Prometheus rules that **periodically** write an expression’s result as a **new time series** with a fixed name. The dashboard then reads a ready-made metric like `job:error_ratio:rate5m` — faster and more predictable.

## How it works

1. `rule_files` points at YAML files with rule groups (on the stand: `deploy/observability/config/rules/*.yml`).
2. Each group has an `interval` (default = `global.evaluation_interval`, here **15s**).
3. A `record` rule evaluates `expr` and stores a series named by the `record` field.
4. An `alert` rule does the same evaluation, but when the condition fires it sends to Alertmanager (you already saw this in basic on `demo-alerts.yml`).

```yaml
groups:
  - name: api_rates
    interval: 30s
    rules:
      - record: job:demo_http_requests:rate5m
        expr: sum(rate(demo_http_requests_total[5m])) by (job)
```

After applying, Prometheus → **Status → Rules** shows group `api_rates`, and Graph shows the new metric.

## Naming (convention)

Recommended name pattern (not a hard standard, but common in the community):

```text
level:metric:operations
```

Examples:

| Name | Meaning |
|-----|--------|
| `instance:node_cpu:rate5m` | rate by instance |
| `slo:api_availability:ratio5m` | availability SLI over 5m |
| `job:demo_errors:ratio5m` | error share by job |

The `slo:` prefix in this course is used for metrics tied to error budget (see [07-slo-sli-sla.md](07-slo-sli-sla.md) and [examples/slo-recording-rules.yml](examples/slo-recording-rules.yml)).

## Recording vs alerting rules

| | Recording | Alerting |
|---|-----------|----------|
| Field | `record:` | `alert:` |
| Result | New metric in TSDB | Event in Alertmanager |
| `for:` | No | Yes (anti-flap) |
| Typical use | Dashboards, intermediate SLIs | Paging, tickets |

Chain: **raw metrics → recording (SLI) → alerting (SLO breached)**. Alerting on a raw `rate()` over 10,000 series is a bad idea; alerting on `slo:demo_availability:ratio5m < 0.995` is sensible.

## Practice on the stand

The base compose already mounts the rules directory:

```text
deploy/observability/config/rules/demo-alerts.yml   # alerting
```

For recording you’ll add, for example, `recording-demo.yml` (in lab [02-lab-recording.md](02-lab-recording.md)).

The demo app exports:

- `demo_http_requests_total{method, path, status}`
- `demo_http_request_duration_seconds_bucket` (histogram)

Handy recordings for an “RPS and errors” dashboard:

```yaml
- record: demo:http_requests:rate5m
  expr: sum(rate(demo_http_requests_total[5m])) by (status)

- record: demo:http_errors:rate5m
  expr: sum(rate(demo_http_requests_total{status=~"5.."}[5m]))
```

## Reloading configuration

In `docker-compose.yml`, Prometheus has `--web.enable-lifecycle`. After editing rules:

```bash
curl -X POST http://localhost:9090/-/reload
```

Or restart the container. Check: **Prometheus → Status → Rules** — group **green**, **Last evaluation** fresh.

## Common mistakes

| Mistake | Symptom | Solution |
|--------|---------|---------|
| Division by zero | `NaN` in recording | `or vector(0)`, `> 0` in denominator, `clamp_min` |
| Window too short `[1m]` with `scrape_interval: 15s` | Noise, gaps | At least `[2m]`, preferably `[5m]` for rate |
| High cardinality in `by (...)` | Series explosion | Aggregate only needed labels |
| Duplicate `record` names | Rule conflict | Unique names within the cluster |

## Related chapters

- **Histograms:** recording for `histogram_quantile` — in [11-histograms-quantiles.md](11-histograms-quantiles.md).
- **SLO:** recording chain for availability — [07-slo-sli-sla.md](07-slo-sli-sla.md).
- **Kafka:** lag and broker metrics are also worth precomputing — [kafka-intermediate/17-monitoring.md](../kafka-intermediate/17-monitoring.md).

## Checklist

- [ ] Explained how `record` differs from `alert`.
- [ ] Know where in the Prometheus UI to check rule state.
- [ ] Understand why to lift `rate()` and error ratios into separate names.

**Next:** [02. Lab: recording rules](02-lab-recording.md).
