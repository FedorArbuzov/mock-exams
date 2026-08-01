# 12. Lab: p95 latency demo-app

## Goal

Build **p50/p95/p99** from the demo-app histogram, compare with the **average**, add a recording rule for p95.

## Setup

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/traffic.sh
```

Metrics: http://localhost:8000/metrics — find `demo_http_request_duration_seconds_bucket`.

## Task 1. Quantiles in Prometheus

In **Graph**:

```promql
histogram_quantile(0.50,
  sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le)
)

histogram_quantile(0.95,
  sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le)
)

histogram_quantile(0.99,
  sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le)
)
```

Record approximate values after traffic (seconds).

## Task 2. Average vs p95

```promql
sum(rate(demo_http_request_duration_seconds_sum[5m]))
/
sum(rate(demo_http_request_duration_seconds_count[5m]))
```

On one chart with p95. Which series is higher? Why is the gap small on synthetic uniform random?

## Task 3. Breakdown by path

```promql
histogram_quantile(0.95,
  sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le, path)
)
```

How many series by `path`? Matches the code (`/` and `/health`).

## Task 4. Recording rule

File `config/rules/recording-latency.yml`:

```yaml
groups:
  - name: recording_latency
    interval: 30s
    rules:
      - record: demo:http_latency:p95_5m
        expr: |
          histogram_quantile(0.95,
            sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le)
          )
```

Reload. Use `demo:http_latency:p95_5m` in a Grafana Stat with threshold **0.25s** (red above).

## Task 5. Heatmap (Grafana)

Dashboard → panel **Heatmap**:

- Query: `sum(increase(demo_http_request_duration_seconds_bucket[1m])) by (le)`
- Format: heatmap, legend by `le`.

Describe: which buckets get the most observations?

## Expected result

| Check | Criterion |
|----------|----------|
| p50/p95/p99 | Graphs render |
| avg vs p95 | Comparison in notes |
| Recording | `demo:http_latency:p95_5m` exists |
| Heatmap | Distribution by `le` visible |

## Checklist

- [ ] Three quantiles computed
- [ ] Latency recording applied
- [ ] Heatmap saved

**Next:** [13. OTel metrics](13-otel-metrics.md) *(optional)*.
