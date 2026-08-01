# 07. Lab: targets, node-exporter, and diagnosing `up`

## Lab goal

Explore **Status → Targets**, compare the metrics of **demo-app**, **node-exporter**, and **cAdvisor**; simulate **`up==0`** and recover the target.

## Prerequisites

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/smoke.sh
```

See [`deploy/observability/README.md`](../../deploy/observability/README.md).

---

## Task 1. Targets overview

**Why:** a map of metric collection.

1. [http://localhost:9090/targets](http://localhost:9090/targets)
2. Write down the jobs: `prometheus`, `demo-app`, `node-exporter`, `cadvisor`.
3. For each: **Last scrape**, **State**, **Labels** (`job`, `instance`).

**What you'll see:** all **UP**, an interval of ~15s.

---

## Task 2. Raw `/metrics` for demo-app

```bash
curl -s http://localhost:8000/metrics | grep -E "^demo_http|^# TYPE demo"
```

**What you'll see:** TYPE counter/gauge/histogram and the labels `method`, `path`, `status`.

In the Prometheus Graph:

```promql
count({__name__=~"demo_http.*"})
```

(a series-count estimate — on the order of tens, not thousands).

---

## Task 3. node-exporter

```promql
node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes
```

**What you'll see:** the share of free RAM, 0–1.

```promql
rate(node_disk_read_bytes_total[5m])
```

Optionally — correlate it with the host load.

---

## Task 4. cAdvisor UI

Open [http://localhost:8082](http://localhost:8082) — the compose containers.

In PromQL:

```promql
sum by (name) (rate(container_cpu_usage_seconds_total{name=~".*demo.*"}[5m]))
```

**What you'll see:** the CPU usage of the demo-app container (the name may differ — tune the regex by the `name` label from the **Table**).

---

## Task 5. Simulating `up==0`

**Why:** to practice a runbook.

```bash
docker compose stop demo-app
```

Wait 30–60 s. In **Targets**, `demo-app` → **DOWN**. Query:

```promql
up{job="demo-app"}
```

**What you'll see:** `0` or an absent series.

Recovery:

```bash
docker compose start demo-app
```

After 1–2 scrape cycles — **UP** again.

---

## Task 6. Scrape duration

```promql
scrape_duration_seconds{job="demo-app"}
```

**What you'll see:** fractions of a second. Compare with `job="cadvisor"` (often heavier).

---

## Success criteria

- [ ] All the stack's jobs and their targets are listed
- [ ] The demo-app `/metrics` was viewed manually
- [ ] A `node_memory_*` query was run
- [ ] After `stop demo-app` — `up==0`, after `start` — recovery
- [ ] The difference between app metrics vs node vs container is clear

## What to take to work

- The first step when there are "no metrics" is **Targets**, not Grafana
- Stopping a container = a learning analog of a pod crashing

Next lesson: [08. Alerting](08-alerting-basics.md).
