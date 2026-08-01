# 05. Cardinality, cost, and "the metrics ate the budget"

## Intro: one release — a ×10 bill

The team added a `user_id` label to an HTTP counter "for debugging." A week later Prometheus **won't start**, cardinality explosion, disk full. At the interview a senior must explain **why** and how to design metrics.

## Cardinality in Prometheus

**Cardinality** is the number of unique **time series** = unique combinations of metric name + labels.

```text
http_requests_total{method="GET", path="/api", status="200"}
```

Add `user_id` with 1M users → up to **1M series** for a single metric.

| Safe labels | Dangerous labels |
|-------------------|----------------|
| `service`, `method`, `status` class | `user_id`, `order_id`, `trace_id` |
| `le` in a histogram (fixed buckets) | `url` full path with an id |
| `namespace`, `pod` (bounded by the HPA) | unbounded `error_message` |

## Back-of-the-napkin estimate

```text
series ≈ (#metrics) × ∏ (#values per label)
```

Example: 50 endpoints × 5 methods × 10 statuses = 2500 series — OK.  
× 100,000 user_ids — **not OK**.

PromQL to find the "heavy" metrics (Prometheus 2.x):

```promql
topk(10, count by (__name__)({__name__=~".+"}))
```

Or via `prometheus_tsdb_symbol_table_size` / the `promtool tsdb analyze` tooling on a snapshot.

## Histogram vs Summary

| Type | Cardinality | Note |
|-----|-------------|---------|
| **Histogram** `_bucket`, `_sum`, `_count` | buckets × labels | Standard, aggregatable via `histogram_quantile` |
| **Summary** quantiles | quantiles × labels | Not aggregatable across replicas |

Prefer a **histogram** with fixed buckets.

## Cost: self-hosted vs managed

| Factor | Prometheus VM | Amazon AMP / Grafana Cloud | CloudWatch |
|--------|-----------------|----------------------------|------------|
| Billing driver | Disk, RAM, CPU | Ingested samples | Custom metrics, API calls |
| Cardinality | Your risk | Limits + overage | Per-metric-name + dimensions |
| Retention | `retention=` | tiered | 15 months for metrics by default |

CloudWatch: a **metric filter** from logs is cheaper than writing every event as a custom metric without aggregation — see [aws-intermediate/19](../aws-intermediate/19-cloudwatch.md).

## Traces and logs cardinality

- **Traces:** high cardinality in **attributes** (SQL text, email) — expensive in Jaeger/Tempo.
- **Logs:** structured JSON is OK; a **unique message per request** blows up the Loki index.

Rule: **high cardinality → logs/traces with sampling**, not labels.

## Redis exporter caveat

`redis_exporter` with `check-keys` over millions of keys is a disaster. For Redis use the aggregates from [`INFO`](../redis-intermediate/15-monitoring.md), not per-key series in Prometheus.

## Governance

| Practice | Effect |
|----------|--------|
| Naming convention (`<service>_<unit>_<total>`) | Reviewable |
| `metric_relabel_configs` drop | Protection at ingest |
| Recording rules | Compression for dashboards |
| PR checklist: "new labels?" | Catches `user_id` |

## At the interview

1. **Why can't you put `trace_id` in labels?** Unbounded series; trace_id belongs in logs/exemplars.
2. **How do you alert without a user label?** Aggregate on `status`, route template `/users/:id`.
3. **RED vs USE?** RED for services; USE for resources ([07](07-troubleshooting-runbooks.md)).

## Summary

- Labels are a **contract** with the TSDB; every new label is a potential explosion.
- Histogram + bounded labels; PII/high-card → attributes/logs, not metrics.
- CloudWatch and managed Prometheus bill on **ingest** — cardinality = money.

Next lesson: [06-lab-cardinality.md](06-lab-cardinality.md).
