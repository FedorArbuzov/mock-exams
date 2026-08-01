# 11. Histograms and quantiles in Prometheus

## Metric types (brief)

| Type | Example | For quantiles |
|-----|--------|----------------|
| Counter | `requests_total` | No |
| Gauge | `queue_depth` | No (only avg/max in an instant) |
| Histogram | `latency_seconds_bucket` | **Yes** |
| Summary | `latency_seconds` with `quantile` | Yes (client-side) |

On demo-app:

```text
demo_http_request_duration_seconds_bucket{path, le}
demo_http_request_duration_seconds_sum
demo_http_request_duration_seconds_count
```

Buckets are defined in code: `0.005 … 1.0` seconds (`deploy/observability/demo/app.py`).

## How a histogram works

Each observation `observe(0.12)` increments counters in **all** buckets where `le >= 0.12`.

```text
le="0.1"   → does not increment
le="0.25"  → +1
le="0.5"   → +1
le="+Inf"  → +1
```

`_sum` — sum of values, `_count` — number of observations.

## histogram_quantile

Quantile estimate **from aggregated** buckets (not exact per-request stats):

```promql
histogram_quantile(
  0.95,
  sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le)
)
```

| Mistake | Consequence |
|--------|-------------|
| Forgot `by (le)` | Wrong quantile |
| `rate` on `_bucket` without sum | Broken series |
| Buckets too coarse | Poor p99 accuracy |

## Recording for latency SLO

```yaml
- record: demo:http_latency:p95_5m
  expr: |
    histogram_quantile(0.95,
      sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le)
    )
```

SLO: “95% of requests faster than 200ms” → alert `demo:http_latency:p95_5m > 0.2`.

## Histogram vs Summary

| | Histogram | Summary |
|---|-----------|---------|
| Quantile | On the Prometheus side | On the client side |
| Aggregation across pods | Yes (if same buckets) | **No** (cannot avg quantiles) |
| Recommendation | HTTP latency, sizes | Rare in new systems |

## Cardinality

A `histogram` with labels `user_id` × `path` × `status` — series explosion. For a latency SLI, `le` + one `service` or `handler` label is enough.

## avg vs p95

```promql
rate(demo_http_request_duration_seconds_sum[5m])
/
rate(demo_http_request_duration_seconds_count[5m])
```

The average is **sensitive** to outliers differently than p95: with rare timeouts avg may look “fine” while p95 does not.

## Grafana

Heatmap panel on `increase(bucket[1m])` — distribution visualization. Stat panel — `histogram_quantile(0.99, ...)`.

## Kafka latency

Producer `request-latency-max` and consumer commit latency — often histogram or gauge in JMX; for stream SLOs — p95 of message processing ([17-monitoring](../kafka-intermediate/17-monitoring.md)).

## Checklist

- [ ] Explained the role of label `le`.
- [ ] Write `histogram_quantile` with `sum(...) by (le)`.
- [ ] Know why Summary aggregates poorly.

**Next:** [12. Lab: histogram](12-lab-histogram.md).
