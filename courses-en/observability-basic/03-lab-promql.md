# 03. Lab: PromQL — rate, errors, p95

## Lab goal

Bring up the observability stack, generate traffic, and run **basic PromQL queries** in the Prometheus UI: `up`, `rate`, the share of 404s, and **p95 latency** from a histogram.

## Prerequisites

- Docker, **4+ GB RAM** recommended.
- From the repository root:

```bash
cd deploy/observability
docker compose up -d --build
docker compose ps
bash scripts/smoke.sh
bash scripts/traffic.sh
```

Details: [`deploy/observability/README.md`](../../deploy/observability/README.md).  
Query cheat sheet: [`examples/promql-queries.txt`](examples/promql-queries.txt).

---

## Task 1. Targets and `up`

**Why:** without a live scrape, PromQL is meaningless.

1. Open [http://localhost:9090/targets](http://localhost:9090/targets).
2. Confirm: **demo-app**, **node-exporter**, **prometheus** — State **UP**.

In **Graph** run:

```promql
up
up{job="demo-app"}
```

**What you'll see:** values of `1` for live targets; when demo-app is stopped — `0`.

---

## Task 2. RPS by status

**Why:** RED — Rate; a counter requires `rate`.

```promql
sum(rate(demo_http_requests_total[5m]))
```

By status:

```promql
sum by (status) (rate(demo_http_requests_total[5m]))
```

Switch **Graph** → Table, sort by Value.

**What you'll see:** a non-zero RPS after `traffic.sh`; separate series for `200` and `404`.

---

## Task 3. The share of 404s

**Why:** Errors in RED are not only 5xx.

```promql
sum(rate(demo_http_requests_total{status="404"}[5m]))
/
sum(rate(demo_http_requests_total[5m]))
```

**What you'll see:** a share of about **0.05–0.15** (the script hits `/missing` on every 10th request). Without traffic — `NaN`.

Repeat `bash scripts/traffic.sh` and click **Execute** again.

---

## Task 4. p95 latency

**Why:** Duration — histogram + `histogram_quantile`.

```promql
histogram_quantile(
  0.95,
  sum by (le) (rate(demo_http_request_duration_seconds_bucket[5m]))
)
```

**What you'll see:** a value in **seconds** (e.g. 0.1–0.25). Compare it with p99 (`0.99` instead of `0.95`).

---

## Task 5. Gauge in-flight

**Why:** the difference between a Gauge and a Counter.

```promql
demo_http_in_progress
```

During a long request the value may be > 0; at rest — 0.

---

## Task 6. node-exporter (optional)

```promql
100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

**What you'll see:** the approximate host CPU load (%).

---

## Task 7. Exporting a query

Copy the three working queries (RPS, 404 share, p95) into your own file or into a comment in your report. Compare with [`examples/promql-queries.txt`](examples/promql-queries.txt).

---

## Success criteria

- [ ] All key targets are **UP**
- [ ] `rate(demo_http_requests_total[5m])` gives an RPS > 0 after traffic
- [ ] The 404 share is computed without a parse error
- [ ] p95 from the histogram returns a number < 1s on the stack
- [ ] It's clear why `rate` doesn't work without `[5m]`

## What to take to work

- PromQL in the Prometheus UI → the same queries in Grafana Explore
- Before an incident, check **`up`** and the presence of **recent samples**
- Counters — only via **`rate` / `increase`**

Next lesson: [04. Grafana](04-grafana.md).
