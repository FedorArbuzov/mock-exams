# 08. Lab: Error budget and SLO recording

## Goal

Wire up **SLO recording rules**, build an availability panel, simulate budget “burn”, and see an alert (or a Grafana threshold).

## Setup

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/traffic.sh
```

## Task 1. SLO rules

Copy [examples/slo-recording-rules.yml](examples/slo-recording-rules.yml) to:

```text
deploy/observability/config/rules/slo-demo.yml
```

Reload:

```bash
curl -X POST http://localhost:9090/-/reload
```

Check metrics:

```promql
slo:demo_availability:ratio5m
slo:demo_errors:ratio5m
```

## Task 2. Target SLO on paper

Record in `slo-demo-app.md`:

| Field | Value |
|------|----------|
| Service | demo-app |
| SLI | HTTP availability (2xx / all) |
| SLO target | 99.5% / 30d (training) |
| Error budget | 0.5% of requests may be “unsuccessful” |

Compute: at **10,000** requests per day, how many “unsuccessful” are allowed per day? (Answer: 50 under a linear model.)

## Task 3. Grafana panel

Panels:

1. **Stat** — `slo:demo_availability:ratio5m * 100`, threshold: green > 99.5, red below.
2. **Time series** — `slo:demo_errors:ratio5m`.
3. **Recording RPS** — `slo:demo_http_requests:rate5m`.

## Task 4. Burn simulation

Existing alert `DemoHighErrorRate` fires at >5% 5xx. Generate many 404s (not 5xx):

```bash
for i in $(seq 1 500); do curl -sf http://localhost:8000/missing >/dev/null 2>&1 || true; done
```

Question: **does** `slo:demo_availability:ratio5m` **change**? Why? (Hint: 404 is neither in `2..` nor in `5..` — check the SLI formula in the rules.)

*Stretch:* change the success recording to `status!~"5.."` (everything except 5xx) and reload rules — repeat the experiment.

## Task 5. Burn alert (optional)

Add to `slo-demo.yml`:

```yaml
      - alert: DemoSLOAvailabilityLow
        expr: slo:demo_availability:ratio5m < 0.995
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "Demo SLO availability below 99.5% (5m window)"
```

Make it fire: stop `demo-app` (`docker compose stop demo-app`) for 3 minutes — availability drops. **Alertmanager:** http://localhost:9093.

Don’t forget `docker compose start demo-app`.

## Expected result

| Check | Criterion |
|----------|----------|
| Rules `slo_demo` | Green in Prometheus |
| slo doc | SLI/SLO/budget filled in |
| Panel | 3 panels work |
| Understanding | 404 vs 5xx for SLI explained |

## Checklist

- [ ] `slo-demo.yml` applied
- [ ] SLO panel in Grafana
- [ ] 404 experiment and “why” answer

**Next:** [09. Alertmanager routing](09-alertmanager-routing.md).
