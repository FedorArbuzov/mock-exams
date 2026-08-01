# 08. Lab: on-call drill on the stack

## Goal

Go through a **simulated incident** in 45–60 min: alert → RED → logs (if the overlay is present) → trace → runbook → postmortem notes.

## Prerequisites

- [07-troubleshooting-runbooks](07-troubleshooting-runbooks.md)
- Stack: `docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d`
- [`examples/runbook-template.md`](examples/runbook-template.md)

A timer and an "incident channel" (a chat with yourself or a partner).

---

## Scenario A: latency (30 min)

**Symptom (from the "manager"):** "The API is slow, few errors."

### Step 1 — Metrics (10 min)

```bash
bash scripts/traffic.sh
```

PromQL:

```promql
histogram_quantile(0.99, sum(rate(demo_http_request_duration_seconds_bucket[5m])) by (le))
sum(rate(demo_http_requests_total[5m])) by (status)
```

Record p99 and the error ratio.

### Step 2 — Trace (10 min)

Send a trace from [02-lab-jaeger](02-lab-jaeger.md). In Jaeger find the child span `redis.GET` — **hypothesis:** Redis is slow.

Redis branch (tabletop or a real `deploy/redis`):

```bash
redis-cli SLOWLOG GET 5
redis-cli INFO commandstats
```

### Step 3 — Runbook (10 min)

Copy the template → `my-runbook-latency.md`. Fill in:

- Symptoms
- 3 PromQL queries from the scenario
- Mitigation: "scale cache", "fix hot key"

---

## Scenario B: error spike (15 min)

Generate 404s:

```bash
for i in $(seq 1 100); do curl -sf "http://localhost:8000/missing" >/dev/null 2>&1 || true; done
```

```promql
sum(rate(demo_http_requests_total{status="404"}[5m]))
/ sum(rate(demo_http_requests_total[5m]))
```

**Question:** is this a SEV-1? Justify it (depends on the SLO for 404 vs 5xx).

---

## Scenario C: "No data" (10 min)

Stop the demo-app:

```bash
docker compose stop demo-app
```

After 2–3 scrape intervals:

```promql
up{job="demo-app"}
```

Which alert fires from [`demo-alerts.yml`](../../deploy/observability/config/rules/demo-alerts.yml)? Record the name and `for:`.

Restore:

```bash
docker compose start demo-app
```

---

## Post-incident (5 min)

| Field | Your answer |
|------|-----------|
| Root cause (for the exercise) | |
| Time to detect | |
| Time to mitigate | |
| One action item | |

---

## Success criteria

- [ ] Runbook `my-runbook-latency.md` with PromQL and mitigation
- [ ] Jaeger trace linked to the Redis hypothesis
- [ ] `up{job="demo-app"}==0` explained
- [ ] Post-incident table filled in

Next lesson: [09-interview-qa.md](09-interview-qa.md).
