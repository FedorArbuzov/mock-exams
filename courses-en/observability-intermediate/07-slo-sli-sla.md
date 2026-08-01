# 07. SLO, SLI, and SLA

## Three levels of agreement

| Term | What it is | Example |
|--------|---------|--------|
| **SLI** (Indicator) | Measurable quality signal | Share of successful HTTP requests over a window |
| **SLO** (Objective) | Target value for the SLI | 99.5% of requests succeed over 30 days |
| **SLA** (Agreement) | Legal/commercial contract with consequences | 10% refund if SLO is breached |

In day-to-day ops, engineers live in the **SLI + SLO** pair; SLA is for legal and account teams.

## A good SLI

Properties:

- **User-facing** — reflects client experience (availability, latency, correctness).
- **Measurable** — from metrics, logs, or synthetics.
- **Aggregable** — one number per service, not a thousand charts.

For demo-app on the stand:

| SLI | PromQL (idea) |
|-----|----------------|
| Availability | `2xx / all` on `demo_http_requests_total` |
| Latency | `histogram_quantile` on `demo_http_request_duration_seconds` |
| Error rate | `5xx / all` |

## SLO and window

An SLO is almost always tied to a **window**:

- **Rolling 30d** — “over the last 30 days”.
- **Calendar month** — business reporting.

Example: **99.9% availability SLO** over 30 days → allowed error share:

```text
Error budget = 1 - SLO = 0.1% “bad” events
```

At 1M requests/month — ~1000 “bad” (simplified; exact definition depends on what counts as an event).

## Error budget

**Error budget** — how much “bad” behavior you can “spend” without breaching the SLO.

| Budget state | Team action |
|------------------|------------------|
| Plenty left | Features, risky releases |
| Burning fast | Release freeze, focus on reliability |
| Exhausted | Incident mode, postmortem, revisit SLO |

Burn rate — how fast the budget is spent. Alerting on **fast burn** (multi-window) catches an incident before “we dropped below 99.9% for the month”.

## Recording rules for SLOs

Lift long expressions into recording (see [01-recording-rules.md](01-recording-rules.md)):

```yaml
- record: slo:demo_availability:ratio5m
  expr: |
    sum(rate(demo_http_requests_total{status=~"2.."}[5m]))
    /
    sum(rate(demo_http_requests_total[5m]))
```

Ready file: [examples/slo-recording-rules.yml](examples/slo-recording-rules.yml).

Alert (simplified):

```yaml
- alert: DemoSLOFastBurn
  expr: slo:demo_availability:ratio5m < 0.99
  for: 5m
```

Production uses **multi-burn-rate** (Google SRE workbook) — in advanced.

## SLOs and alerts

| Bad | Better |
|-------|-------|
| Alert “CPU > 80%” with no user link | Alert on SLI / burn rate |
| 50 alerts per pod | Service aggregate + routing ([09-alertmanager-routing.md](09-alertmanager-routing.md)) |
| 100% SLO | Unrealistic; no budget for releases |

## Kafka example

For a streaming platform the SLI is often **lag** and **consumer availability**, not broker CPU ([17-monitoring](../kafka-intermediate/17-monitoring.md)):

- SLI: “95% of the time lag < 10k messages for group `orders`”.
- SLO: 99% over 7 days.
- Metric: `kafka_consumergroup_lag` (or similar), recording `slo:kafka_lag:max5m`.

## Documenting an SLO

Minimal doc (1 page):

1. Service and user.
2. SLI (formula + metric source).
3. Target and window.
4. Error budget policy.
5. Runbook on burn.

## Checklist

- [ ] Distinguish SLI, SLO, SLA.
- [ ] Compute error budget from a target (e.g. 99.9%).
- [ ] Understand why recording `slo:*` before alerts.

**Next:** [08. Lab: error budget](08-lab-error-budget.md).
