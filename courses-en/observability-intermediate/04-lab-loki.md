# 04. Lab: Loki and LogQL in Grafana

## Goal

Bring up the **Loki + Promtail** overlay, see container logs in Grafana Explore, run queries from [examples/logql-queries.txt](examples/logql-queries.txt).

## Setup

Base stack is already running. Add logs:

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.logs.yml up -d
docker compose ps
```

| Service | Check |
|--------|----------|
| Loki | `curl -s http://localhost:3100/ready` → `ready` |
| Promtail | `docker compose logs promtail --tail 20` — no fatal error |

Generate traffic and container logs:

```bash
bash scripts/traffic.sh
```

*Windows:* Promtail needs access to `docker.sock`; if there are no logs — see troubleshooting in [deploy/observability/README.md](../../deploy/observability/README.md).

## Task 1. Label browser

1. Grafana → **Explore** → datasource **Loki**.
2. **Label browser** — find label `container`.
3. Select `mock-demo-app` (or the current name from `docker compose ps`).

Query:

```logql
{container="mock-demo-app"}
```

Lines should appear (container stdout; demo-app suppresses access-log in code — mostly system messages; for practice, **prometheus** and **grafana** logs work well).

## Task 2. Line filter

```logql
{container="mock-prometheus"} |= "level=error"
```

Or any container with enough log volume:

```logql
{container=~"mock-.*"} != ""
```

Copy 3 more queries from `examples/logql-queries.txt` and note what each returned.

## Task 3. Metric query over logs

```logql
sum by (container) (rate({job="docker"}[5m]))
```

Build a **bar gauge** “top containers by log volume”. Who is the noisiest?

## Task 4. Correlation with Prometheus

1. Explore → **Prometheus**: `sum(rate(demo_http_requests_total[5m]))`.
2. Note the RPS spike interval (after `traffic.sh`).
3. Explore → **Loki**, same interval: logs from `mock-demo-app` or neighboring services.

In notes answer: **which labels are shared** between metric `demo_http_requests_total` and the Loki stream? (On the Docker stand — few; in k8s — `pod`, `namespace` — see [15-k8s-servicemonitor.md](15-k8s-servicemonitor.md).)

## Task 5. *Optional* — panel on a dashboard

Dashboard → Add panel → Loki datasource → logs panel with:

```logql
{container=~"mock-(prometheus|demo-app)"}
```

Next to it, a Prometheus time series on the same dashboard.

## Expected result

| Check | Criterion |
|----------|----------|
| Loki ready | HTTP 200 on `/ready` |
| Explore | Streams with label `container` visible |
| LogQL | ≥4 queries run (examples file + your own) |
| Correlation | Described in 2–3 sentences in notes |

## Troubleshooting

| Symptom | Action |
|---------|----------|
| No data | Overlay not up; Promtail cannot see the socket |
| Unknown job | In Promtail `job_name: docker` — query `{job="docker"}` |
| Grafana no Loki | Datasource provisioning; restart grafana |

## Checklist

- [ ] Logs overlay running
- [ ] Explore Loki works
- [ ] Metric query `rate({...}[5m])` built

**Next:** [05. Promtail pipelines](05-promtail-pipelines.md).
