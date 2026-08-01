# 13. On-call capstone: observability platform end-to-end

## Project goal (4–6 hours)

Build a **documented** artifact for your portfolio and interviews: traces on the Docker stack, k8s metrics (optional), runbooks, a design doc, and mock interview notes — all as a single **observability story**.

## Prerequisites

Chapters **01–12** completed, or equivalent intermediate + this README.

Stacks:

```bash
# Docker (required)
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.otel.yml up -d --build

# K8s (optional)
mockctl up
# helm install kube-prom ... see 03-kube-prometheus.md
```

---

## Part A — Traces (60 min)

1. Send a trace via OTLP ([02-lab-jaeger](02-lab-jaeger.md)) — a Jaeger **16686** screenshot.
2. Add a "Trace search" field to the runbook: service, min duration.
3. Explain in 5 sentences the propagation across 3 services (tabletop).

**Deliverable:** a screenshot + a paragraph in `capstone-notes.md`.

---

## Part B — Metrics & cardinality (60 min)

1. Record `prometheus_tsdb_head_series` before/after traffic ([06-lab-cardinality](06-lab-cardinality.md)).
2. A PromQL dashboard (3 panels): error ratio, p99 latency, `up`.
3. Write a **cardinality policy** (10 lines): allowed/forbidden labels.

**Deliverable:** a `## Metrics` section in `capstone-notes.md`.

---

## Part C — Kubernetes (90 min, optional)

If you have a cluster:

1. Install kube-prometheus-stack ([04-lab-servicemonitor](04-lab-servicemonitor.md)).
2. OOM drill or a screenshot of `kube_pod_container_status_restarts_total`.
3. ServiceMonitor YAML (even if the target is DOWN — explain why).

**Deliverable:** `k8s-screenshots/` or a description in the notes.

---

## Part D — Runbooks (60 min)

Two runbooks based on [`examples/runbook-template.md`](examples/runbook-template.md):

1. **High latency p99** — the Redis branch ([redis-advanced/09](../redis-advanced/09-troubleshooting.md)).
2. **Target down** — `up{job="demo-app"}==0`.

**Deliverable:** `runbook-latency.md`, `runbook-target-down.md`.

---

## Part E — AWS tabletop (30 min)

Without an AWS account — in writing:

1. How would you connect Prometheus alerts and CloudWatch alarms for a Lambda worker? ([19](../aws-intermediate/19-cloudwatch.md), [20](../aws-intermediate/20-lab-cloudwatch.md))
2. Metric filter vs the native `Errors` metric — when do you use which?

**Deliverable:** an `## AWS hybrid` section in the notes.

---

## Part F — System design (60 min)

Write up [12-lab-system-design](12-lab-system-design.md) for **your** domain (pick prompt A/B/C).

**Deliverable:** `my-observability-design.md` (≥9/12 rubric).

---

## Part G — Mock interview (45 min)

Go through [10-lab-mock-interview](10-lab-mock-interview.md). Record your rapid-fire score /8.

**Deliverable:** a `## Mock interview` section in the notes.

---

## Final checklist

| Artifact | Done |
|----------|--------|
| `capstone-notes.md` | ☐ |
| Jaeger trace screenshot | ☐ |
| 2 runbooks | ☐ |
| Design doc | ☐ |
| Cardinality policy | ☐ |
| (Opt.) k8s ServiceMonitor | ☐ |
| Mock interview score | ☐ |

---

## Self-check before the interview

- [ ] I explain the three pillars without a pause
- [ ] I draw the OTel pipeline on the board
- [ ] I name 3 PromQL queries for RED
- [ ] I explain cardinality with the `user_id` example
- [ ] I link a trace → Redis SLOWLOG
- [ ] I compare Alertmanager vs a CloudWatch alarm
- [ ] [`interview-cheatsheet.md`](interview-cheatsheet.md) — covered from memory

---

## Cleanup

```bash
cd deploy/observability
docker compose -f docker-compose.yml -f docker-compose.otel.yml down -v
helm uninstall kube-prom -n monitoring  # if you installed it
```

Congratulations — the observability-advanced capstone is complete.
