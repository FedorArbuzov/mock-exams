# 06. Lab: cardinality on the demo-app

## Goal

See **time series** grow from bad labels, compare with a safe schema, and run the "top metrics" PromQL on [`deploy/observability`](../../deploy/observability/README.md).

## Prerequisites

- [05-cardinality-cost](05-cardinality-cost.md)
- Base stack: `docker compose up -d --build`

---

## Task 1. Baseline

```bash
cd deploy/observability
bash scripts/traffic.sh
```

Prometheus → **Status → TSDB Status** (or query):

```promql
prometheus_tsdb_head_series
```

Record the number **A**.

---

## Task 2. Tabletop — a bad design

The `checkout` service writes:

```text
checkout_clicks_total{user_id="...", sku="...", campaign="..."}
```

| Parameter | Value |
|----------|----------|
| DAU | 500,000 |
| SKU active | 20,000 |
| campaigns | 50 |

**Question:** order of magnitude of series? Propose a **safe** alternative.

<details>
<summary>Hint</summary>

500k × 20k × 50 — billions — unrealistic. Alternative: `checkout_clicks_total{campaign="..."}` without user_id; per-user analytics → event log / warehouse.
</details>

---

## Task 3. demo-app labels (observation)

Open [`deploy/observability/demo/app.py`](../../deploy/observability/demo/app.py):

```python
REQUESTS = Counter("demo_http_requests_total", "...", ["method", "path", "status"])
```

Generate a 404:

```bash
for i in $(seq 1 50); do curl -sf "http://localhost:8000/missing" >/dev/null 2>&1 || true; done
```

PromQL:

```promql
count(demo_http_requests_total)
```

How many unique series? Why is `path` still tolerable here?

---

## Task 4. A "bad" path label (thought experiment)

If `path` included `/users/12345` for every id — what would happen to `prometheus_tsdb_head_series`?

Write a **metric_relabel_configs** drop for the `path` label (draft):

```yaml
metric_relabel_configs:
  - source_labels: [path]
    regex: '/users/.*'
    target_label: path
    replacement: '/users/:id'
```

---

## Task 5. CloudWatch tabletop

From [aws-intermediate/19](../aws-intermediate/19-cloudwatch.md):

1. How does a **metric filter** on ERROR in logs differ from a custom metric on every log line?
2. When do you choose **SQS ApproximateNumberOfMessagesVisible** over a filter?

Write 2 sentences each.

---

## Task 6. Redis

Why is `redis_key_size{key="..."}` an anti-pattern? Where do you look instead of per-key metrics? ([redis-intermediate/15](../redis-intermediate/15-monitoring.md))

---

## Success criteria

- [ ] Baseline `prometheus_tsdb_head_series` (A) recorded
- [ ] Tabletop: cardinality estimate + fix
- [ ] `count(demo_http_requests_total)` explained
- [ ] Answers on CloudWatch and Redis

Next lesson: [07-troubleshooting-runbooks.md](07-troubleshooting-runbooks.md).
