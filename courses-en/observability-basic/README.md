# Observability — Basic

Basic level: **why observability**, the **Prometheus model**, **PromQL**, **Grafana**, **scrape and exporters**, **alerting**, the **RED/USE golden signals**, an **intro to logs**, and a **comparison with CloudWatch/Datadog**.

**Prerequisites:** basic Linux and Docker ([`linux-basic`](../linux-basic/README.md) or [`linux-intermediate`](../linux-intermediate/README.md) — `docker compose`, `curl`, and a browser are enough).

**Locally:** [`deploy/observability`](../../deploy/observability/README.md) — `docker compose up -d --build`, from the host:

| Service | URL |
|--------|-----|
| Prometheus | [http://localhost:9090](http://localhost:9090) |
| Grafana | [http://localhost:3000](http://localhost:3000) — `admin` / `admin` |
| demo-app | [http://localhost:8000](http://localhost:8000) — `/metrics` |
| Alertmanager | [http://localhost:9093](http://localhost:9093) |

Traffic for the labs: `bash scripts/traffic.sh` in `deploy/observability`.

**Next:** [`observability-intermediate`](../observability-intermediate/README.md) (Loki, Promtail), [`observability-advanced`](../observability-advanced/README.md) (OTel, SLO). On Kubernetes — briefly [`kuber-advanced/14`](../kuber-advanced/14-observability.md) (kube-prometheus-stack).

## How to read the chapters

Each lesson is a **book chapter**, not a cheat sheet. Recommended order within a pair:

1. Read the **theory** (01, 02, 04…) — don't skip the intro and "common mistakes".
2. Open the **lab** (03-lab, 05-lab…) with the stack up via `docker compose up -d --build` in `deploy/observability`.
3. Do the tasks **by number**; compare the output with the "what you'll see" block.
4. If something doesn't add up — [`deploy/observability/README.md`](../../deploy/observability/README.md) (datasource, `up`, OOM).

**Theory structure:** intro (a scenario from work) → what you'll learn → concepts → an example on the stack → mistakes → in production → summary → checklist.

**Lab structure:** goal → prerequisites → tasks 1…N (why / commands / what you'll see) → success criteria.

**Time:** about **40–50 minutes** for a "theory + lab" pair; the [final project](13-final-project.md) — **2–3 hours**.

**Connection cheat sheet:**

| From | Address |
|--------|--------|
| Browser (UI) | `localhost:9090`, `localhost:3000`, `localhost:8000` |
| Inside the Docker network | `prometheus:9090`, `demo-app:8000` |
| Application metrics | `GET http://localhost:8000/metrics` |

## Curriculum

### Fundamentals (01–03)

1. [Why observability](01-why-observability.md)
2. [The Prometheus model: metrics, labels, TSDB](02-prometheus-model.md)
3. [Lab: PromQL on the stack](03-lab-promql.md)

### Visualization (04–05)

4. [Grafana: datasource, panels, variables](04-grafana.md) · 5. [Lab: demo-app dashboard](05-lab-dashboard.md)

### Metric collection (06–07)

6. [Exporters and scrape: jobs, targets, `up`](06-exporters-scrape.md) · 7. [Lab: targets and node-exporter](07-lab-targets.md)

### Alerting (08–09)

8. [Alerting: rules, Alertmanager, routing](08-alerting-basics.md) · 9. [Lab: Alertmanager and firing](09-lab-alertmanager.md)

### Signals and context (10–12)

10. [Golden signals: RED and USE](10-golden-signals.md)
11. [Logs: why, and pairing them with metrics](11-logs-preview.md)
12. [Prometheus/Grafana vs CloudWatch vs Datadog](12-vs-cloudwatch-datadog.md)

### Finale (13)

13. [Final project](13-final-project.md)

## What you should end up with

- You can explain the **three pillars** of observability and the role of **metrics** in an incident.
- You can write basic **PromQL**: `rate`, `histogram_quantile`, label filters.
- You can build a **dashboard** in Grafana with RPS and latency panels.
- You can read **Status → Targets** and diagnose **`up==0`**.
- You can configure an **alert rule** and see the alert in **Prometheus** and **Alertmanager**.
- You can formulate **RED** for an HTTP service and **USE** for a node.
- You understand when to move to **Loki** (intermediate) or **kube-prometheus** (k8s).

## Examples

| Path | Purpose |
|------|------------|
| [`examples/promql-queries.txt`](examples/promql-queries.txt) | ready-made queries for labs 03 and the final project |
| [`examples/alert-rule.yml`](examples/alert-rule.yml) | a sample rule for lab 09 and the project |
