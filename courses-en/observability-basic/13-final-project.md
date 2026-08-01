# 13. Final project: a mini on-call for demo-app

## Intro: pull the basics together into one loop

Separately you know PromQL, Grafana, targets, alerts, and RED. The **finale** is a coherent **operator package** for [`deploy/observability`](../../deploy/observability/README.md): a dashboard, two rules, a runbook, and an incident simulation. No new application code — just configs, the Grafana UI, and `scripts/traffic.sh`.

## What you'll learn (course wrap-up)

- Design a **RED dashboard** and **alerts** with consistent thresholds.
- Run a **learning incident** and document a timeline.
- Formulate a **runbook** from metrics → hypothesis → action.

## Requirements

| # | Requirement | Criterion |
|---|------------|----------|
| 1 | Stack | `docker compose up -d --build`, smoke OK |
| 2 | Dashboard | ≥ 3 RED panels + a `job` or `instance` variable |
| 3 | Alerts | `DemoTargetDown` (or your own `up`) + a rule on **404** or **p95** from [`examples/alert-rule.yml`](examples/alert-rule.yml) |
| 4 | PromQL file | 5+ queries in `PROJECT-promql.txt` (you may copy from [`examples/promql-queries.txt`](examples/promql-queries.txt) with comments) |
| 5 | Incident A | `stop demo-app` → firing → runbook → `start` → resolved |
| 6 | Incident B | traffic + a high share of 404 **or** a manual spike → the warning rule fired (or an explanation of the threshold) |
| 7 | Document | `PROJECT.md` following the template below |
| 8 | Kubernetes (optional) | 1 paragraph: how the same RED appears in [kuber-advanced/14](../kuber-advanced/14-observability.md) |

---

## Phase 1. Prepare the stack

```bash
cd deploy/observability
docker compose up -d --build
bash scripts/smoke.sh
bash scripts/traffic.sh
```

Verify:

- [http://localhost:9090/targets](http://localhost:9090/targets) — all UP
- [http://localhost:3000](http://localhost:3000) — Grafana login
- [http://localhost:8000/metrics](http://localhost:8000/metrics) — exposition

---

## Phase 2. Dashboard "Demo App — Production Ready"

Create a dashboard (lab [05](05-lab-dashboard.md)):

| Panel | PromQL (minimum) |
|--------|------------------|
| RPS | `sum(rate(demo_http_requests_total{job="demo-app"}[5m]))` |
| Error rate | share of `status!~"2.."` |
| p95 | `histogram_quantile(0.95, sum by (le)(rate(demo_http_request_duration_seconds_bucket{job="demo-app"}[5m])))` |
| Saturation (bonus) | `demo_http_in_progress` or node CPU |

Record the **UID** and **tags** in `PROJECT.md`. Screenshots — optional.

---

## Phase 3. Alert rules

1. Make sure `config/rules/*.yml` is wired in.
2. Add **`LabHigh404Rate`** or a rule on **p95 > 0.3** (30s) — your own file `config/rules/project.yml`.
3. `docker compose restart prometheus`
4. `promtool check rules` — if available.

Reconcile the thresholds with the **panel thresholds** (± a reasonable margin).

---

## Phase 4. Runbook (template)

In `PROJECT.md`, a **Runbook: demo-app down** section:

1. **Symptom:** alert `DemoTargetDown` / `up==0`
2. **Check:** Prometheus Targets, `docker compose ps`
3. **Diagnosis:** `docker compose logs demo-app --tail 50`
4. **Mitigation:** `docker compose start demo-app` or `up -d --build`
5. **Verification:** `up{job="demo-app"}==1`, RPS on the dashboard
6. **Escalation:** if it hasn't come back within 15m — …

The second runbook — **high 404 rate** (a link to `traffic.sh` and `/missing`).

---

## Phase 5. Learning incidents

### Incident A — unavailability

```bash
docker compose stop demo-app
# wait for firing > 1m
docker compose start demo-app
```

Record in `PROJECT.md`: the start/end time, a screenshot of Prometheus **Alerts** and Alertmanager.

### Incident B — traffic quality

```bash
bash scripts/traffic.sh
for i in $(seq 1 300); do curl -sf http://localhost:8000/missing >/dev/null 2>&1 || true; done
```

Check the warning rule and the Error rate panel.

---

## Phase 6. Comparison with Kubernetes (optional)

Briefly describe:

- **ServiceMonitor** instead of `static_configs`
- **kube-state-metrics** for pod phase
- **Grafana** from kube-prometheus-stack — [14-observability](../kuber-advanced/14-observability.md)

k8s lab: [15-lab-observability](../kuber-advanced/15-lab-observability.md).

---

## PROJECT.md template

```markdown
# Observability Basic — Final Project

## Author / date

## Stack
- compose revision, Docker RAM

## Dashboard
- URL / title / panels list

## Alerts
| Name | Expr | for | severity |
|-----|------|-----|----------|

## PromQL (file PROJECT-promql.txt)
- 5 queries with a one-line explanation each

## Incident A (down)
- Timeline UTC
- Screenshot/description firing → resolved

## Incident B (404 or latency)
- Actions, result

## Runbooks
- (insert the two sections)

## Kubernetes notes (optional)

## Conclusions
- 3 bullets: what you took to work
```

---

## Grading criteria (self-check)

- [ ] The dashboard answers RED without "No data" after traffic
- [ ] At least 2 working alert rules with different severity
- [ ] The runbook is reproducible by another person
- [ ] Incident A is documented with times
- [ ] The PromQL file doesn't blindly duplicate the examples — it has your own comments
- [ ] The connection with the stack is clear [`deploy/observability/README.md`](../../deploy/observability/README.md)

## Next

- [`observability-intermediate`](../observability-intermediate/README.md) — Loki, LogQL, correlation
- [`observability-advanced`](../observability-advanced/README.md) — OTel, SLO, exemplars
- [`kuber-advanced/14-observability`](../kuber-advanced/14-observability.md) — kube-prometheus-stack

Congratulations on finishing **Observability — Basic**.
