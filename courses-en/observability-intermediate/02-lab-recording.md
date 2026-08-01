# 02. Lab: Recording rules for demo-app

## Goal

Add **recording rules** for RPS and 5xx ratio, confirm they appear in Prometheus, build a simple panel in Grafana.

## Setup

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/smoke.sh
bash scripts/traffic.sh
```

Open Prometheus: http://localhost:9090.

## Task 1. Rules file

Create `deploy/observability/config/rules/recording-demo.yml`:

```yaml
groups:
  - name: recording_demo
    interval: 30s
    rules:
      - record: demo:http_requests:rate5m
        expr: sum(rate(demo_http_requests_total[5m]))

      - record: demo:http_errors:rate5m
        expr: sum(rate(demo_http_requests_total{status=~"5.."}[5m]))

      - record: demo:http_error_ratio:rate5m
        expr: |
          demo:http_errors:rate5m
          /
          demo:http_requests:rate5m
```

The file is picked up automatically (`rule_files: .../rules/*.yml`).

## Task 2. Reload

```bash
curl -X POST http://localhost:9090/-/reload
```

Verification:

1. **Status → Rules** — group `recording_demo`, state OK.
2. Query: `demo:http_requests:rate5m` — non-zero graph after `traffic.sh`.

## Task 3. Compare with “raw” PromQL

In **Graph**, run both expressions on one chart:

```promql
demo:http_requests:rate5m
sum(rate(demo_http_requests_total[5m]))
```

The curves should match (a tiny shift from evaluation timing is fine).

## Task 4. Panel in Grafana

1. http://localhost:3000 → **Explore** or a new Dashboard.
2. **Time series** panel: `demo:http_requests:rate5m`, legend “RPS”.
3. **Gauge** or **Stat** panel: `demo:http_error_ratio:rate5m * 100`, unit **Percent**.

Save the dashboard as `Demo Recording` (optional provisioning under `config/grafana/...` is not required for the lab).

## Task 5. *Stretch*

Add a breakdown by `status` without a cardinality explosion:

```yaml
- record: demo:http_requests:rate5m_by_status
  expr: sum(rate(demo_http_requests_total[5m])) by (status)
```

Reload rules. In Grafana — stacked graph by `status`.

## Expected result

| Check | Criterion |
|----------|----------|
| Rules | `recording_demo` green |
| Metrics | `demo:http_*` respond in PromQL |
| Dashboard | RPS and error % readable without a long expr in the UI |

## Troubleshooting

| Symptom | Action |
|---------|----------|
| Rules did not appear | YAML syntax; `docker compose logs prometheus` |
| `NaN` on ratio | No traffic — run `traffic.sh` again |
| Reload 404 | No `--web.enable-lifecycle` — `docker compose restart prometheus` |

## Checklist

- [ ] Created `recording-demo.yml`
- [ ] Reload done
- [ ] Two panels in Grafana

**Next:** [03. Loki and LogQL](03-loki-logql.md) — bring up the logs overlay.
