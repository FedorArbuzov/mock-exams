# 05. Lab: a Grafana dashboard for demo-app

## Lab goal

Create a **dashboard** with RED panels (RPS, error share, p95), a `job` variable, and thresholds. Verify the data after `traffic.sh`.

## Prerequisites

- The stack is running, smoke OK:

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/traffic.sh
```

- Grafana: [http://localhost:3000](http://localhost:3000) — `admin` / `admin`
- Theory: [04. Grafana](04-grafana.md)

---

## Task 1. Check the datasource

**Why:** "No data" is most often a broken datasource.

1. **Connections → Data sources → Prometheus → Save & test**.
2. **Explore** → query `up{job="demo-app"}` → Run.

**What you'll see:** a line or a dot with the value `1`.

---

## Task 2. A new dashboard

**Why:** to reinforce the RED structure.

1. **Dashboards → New → New dashboard**.
2. Title: `Demo App — Basic`.
3. **Settings** (the gear): Tags `lab`, `observability-basic`.

---

## Task 3. RPS panel

**Why:** Rate.

- **Add visualization** → Prometheus.
- Query A:

```promql
sum(rate(demo_http_requests_total{job="demo-app"}[5m]))
```

- Panel title: `RPS`
- Unit: **requests/sec**

**What you'll see:** a stable RPS > 0 after traffic.

---

## Task 4. Error rate panel (404+5xx)

```promql
sum(rate(demo_http_requests_total{job="demo-app",status!~"2.."}[5m]))
/
sum(rate(demo_http_requests_total{job="demo-app"}[5m]))
```

- Visualization: **Time series** or **Stat**
- Unit: **Percent (0.0–1.0)**
- Thresholds: green < 0.05, yellow < 0.15, red above

**What you'll see:** a non-zero share due to 404s from `traffic.sh`.

---

## Task 5. p95 latency panel

```promql
histogram_quantile(
  0.95,
  sum by (le) (rate(demo_http_request_duration_seconds_bucket{job="demo-app"}[5m]))
)
```

- Unit: **seconds (s)**
- Title: `p95 latency`

---

## Task 6. The job variable

**Why:** one dashboard — several jobs.

1. **Dashboard settings → Variables → Add variable**
2. Type: Query, Data source: Prometheus
3. Query: `label_values(up, job)`
4. Name: `job`, Multi-value + Include All

Update the queries: `{job=~"$job"}` instead of a hard-coded `demo-app`.

**What you'll see:** switching between `demo-app` and `node-exporter` changes the RPS (node has different metrics — expect empty or different series).

---

## Task 7. Saving and JSON (optional)

**Save dashboard**. **Share → Export** — look at the JSON (don't commit secrets).

---

## Success criteria

- [ ] The datasource test succeeds
- [ ] The three RED panels show data after `traffic.sh`
- [ ] The error panel shows a share > 0
- [ ] The `job` variable switches targets
- [ ] The dashboard is saved with a clear title and tags

## What to take to work

- One service — one dashboard + a standard RED row
- Reconcile the panel thresholds with the **alert rules**; don't duplicate different numbers without a reason

Next lesson: [06. Exporters and scrape](06-exporters-scrape.md).
