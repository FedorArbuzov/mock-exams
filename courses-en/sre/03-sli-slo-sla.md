# 03. SLI, SLO, SLA: measurement and agreements

## Intro: "100% uptime", yet customers leave

The dashboard is green: all nodes Ready, CPU < 50%, the synthetic check `/health` returns 200. Meanwhile **1% of checkouts** fail with a `timeout` because of a slow fragment in the chain; **search** returns empty results for Cyrillic after a release; the **mobile app** fails to parse the new JSON format. Management says: "the infrastructure is stable". Support: "three times as many tickets".

The gap appears when an **infrastructure indicator** stands in for a **user experience indicator**. SRE introduces three levels of agreement: **SLI** (what we measure), **SLO** (what target level), **SLA** (what is promised by contract). This is the most substantial chapter in Part I: here we lay down the language on which alerts, releases, and conversations with the business are built.

---

## Three levels: SLI → SLO → SLA

| Term | Full name | Who it lives with | Example |
|--------|------------|-----------|--------|
| **SLI** | Service Level **Indicator** | SRE + dev | "Share of successful HTTP POST /checkout over 5 min" |
| **SLO** | Service Level **Objective** | Service team | "99.9% successful checkouts over 30 rolling days" |
| **SLA** | Service Level **Agreement** | Legal + sales | "On SLO breach — a 10% bill credit" |

**Rule:** engineers work daily with **SLI + SLO**. **SLA** is a layer on top with **monetary** consequences; the SLA target is usually **stricter** than the internal SLO (a buffer).

```text
  User
       │
       ▼
  ┌─────────┐   threshold   ┌─────────┐    contract     ┌─────────┐
  │   SLI   │ ─────────────► │   SLO   │ ──────────────► │   SLA   │
  │ (facts) │                │ (goal)  │   (optional)    │(penalty)│
  └─────────┘                └─────────┘                 └─────────┘
```

---

## A good SLI: four properties

1. **User-centric** — reflects the user journey, not an internal metric.
2. **Measurable** — automatically from logs, metrics, synthetics, traces.
3. **Aggregatable** — one number per service/journey over a window.
4. **Actionable** — when the SLI degrades, the team knows what to do.

### Bad SLIs

| Bad SLI | Why |
|------------|--------|
| CPU < 80% | not about the user |
| "No alerts" | circular |
| Disk free > 10% | a symptom, not experience |
| Mean latency without p99 | hides the tail |

### Good SLIs (examples)

| Service | SLI | Source |
|--------|-----|----------|
| HTTP API | availability = successful / total | ingress metrics, `http_requests_total` |
| API | latency p99 < 500 ms | histogram |
| Batch pipeline | freshness: % jobs completed < 1h late | scheduler metrics |
| Stream consumer | lag < N messages | Kafka exporter ([kafka-intermediate/17](../kafka-intermediate/17-monitoring.md)) |
| Data store | durability: % writes acknowledged | replication lag, ack policy |

---

## Availability: not just "not a 500"

Classic **availability** for request/response:

```text
Availability = (valid requests - bad requests) / valid requests
```

What counts as **bad**:

| Variant | Include | Debatable cases |
|---------|----------|----------------|
| Strict | 5xx, timeout | 429 rate limit — bad? |
| Product | only failed business outcome | 200 with `{"status":"error"}` |
| Synthetic | only probe | doesn't see real clients |

**Document** it in the SLO doc: "5xx and `timeout` — bad; 4xx except 429 — not bad; 429 on abuse — not bad".

**Correctness SLI** (harder): the share of orders with an amount mismatch; the share of responses with an invalid schema. Often via an **audit**, a **reconciliation job**, sampling.

---

## Latency SLI

The user feels the **tail**, not the average.

| Aggregate | When |
|---------|-------|
| p50 | "typical" |
| p95 / p99 | SLO for an interactive API |
| p99.9 | payments, search (careful — noise) |

**SLO wording:** "99% of requests are **fast** over 30d", where **fast** = latency < 300 ms.

Prometheus (idea):

```promql
histogram_quantile(0.99,
  sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
) < 0.3
```

More on histograms — [observability-intermediate/11](../observability-intermediate/11-histograms-quantiles.md).

---

## Measurement windows

| Window type | Description | Pro | Con |
|----------|----------|------|-------|
| **Rolling** 30d | the last 30×24 h | smooths | harder to explain to the business |
| **Calendar month** | 1–31 | reporting | the month boundary "resets" |
| **Rolling 7d** | a week | faster feedback | noise |

An SLO is almost always: **"X% good events over window Y"**.

Example: **99.9% availability over rolling 30 days** → error budget ≈ **0.1%** bad events (see [chapter 04](04-error-budgets.md)).

---

## How many "nines" to choose

Don't copy "like Google". Questions for the product:

1. What happens with **1 h** of checkout downtime on Black Friday?
2. Is there a **competitor** with better UX?
3. How much does the **engineering** of the next nine cost?

| SLO | Product example |
|-----|-----------------|
| 99% | internal admin |
| 99.5% | non-critical B2B API |
| 99.9% | main consumer API |
| 99.95% | checkout, auth |
| 99.99% | payment gateway (expensive) |

**Two SLOs for one service** are the norm: availability **and** latency.

---

## Decomposition: the user journey

Not one SLI for 200 microservices. A **Critical User Journey (CUJ)**:

```text
Browse → Add to cart → Checkout → Pay → Confirm email
```

For each step — its **own** SLI or a shared end-to-end synthetic:

| Step | SLI |
|-----|-----|
| Checkout | success rate POST /checkout |
| Pay | success + p99 latency payment gateway |
| E2E | synthetic script every 1 min |

**End-to-end** catches integrations; **per-service** localizes. You need **both**.

---

## SLI implementation checklist

1. **Data source** — Prometheus, logs, OTel ([observability-intermediate/13](../observability-intermediate/13-otel-metrics.md)).
2. **Labels** — `method`, `route`, `status`, not a high-cardinality `user_id`.
3. **Recording rules** — `slo:checkout_availability:ratio5m` ([observability-intermediate/01](../observability-intermediate/01-recording-rules.md)).
4. **Dashboard** — a single "budget remaining" panel.
5. **Owner** — the team name in the doc.

Example recording (simplified):

```yaml
- record: slo:checkout_availability:ratio5m
  expr: |
    sum(rate(http_requests_total{route="/checkout",status=~"2.."}[5m]))
    /
    sum(rate(http_requests_total{route="/checkout"}[5m]))
```

---

## Multi-window burn (intro)

An alert "SLO < 99.9% over the month" fires **too late**. **Burn rate** is the speed at which the error budget is consumed. The Google SRE Workbook proposes **multi-window, multi-burn-rate** alerts: a fast "burn" over 5 min + confirmation over 1 h.

Intuition:

| Burn | Meaning |
|------|----------|
| 1× | spending the budget exactly as planned |
| 14× | at this rate we'll burn the monthly budget in a day |
| 720× | in an hour — a catastrophe |

Alert details — [chapter 07](07-alerting-on-call.md), advanced [observability-advanced/11](../observability-advanced/11-system-design-observability.md).

---

## SLA vs SLO: the buffer

If the SLA to the customer is **99.5%**, the internal SLO is often **99.7%** — a margin for incidents without payouts. **Never** promise in an SLA something you don't measure with an SLI.

---

## SLO document (a one-page template)

```markdown
# SLO: Checkout API

## Owners
Team: payments-platform; Slack: #payments-sre

## User journey
User completes purchase with card.

## SLIs
1. Availability: non-5xx, non-timeout responses / all valid requests
2. Latency: proportion of requests < 400ms (histogram)

## SLO targets (rolling 30d)
- Availability: 99.95%
- Latency: 99% < 400ms

## Error budget policy
- Budget > 50%: normal releases
- 10–50%: canary only, extra review
- < 10%: freeze except hotfix
- Exhausted: incident review, no feature work until recovery plan

## Dashboards / alerts
- Grafana: ...
- Alerts: burn-rate ...

## Runbooks
- https://...
```

The course finale is to fill in such a doc: [chapter 16](16-synthesis-practice.md).

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| SLOs on everything | no priorities, alert fatigue |
| SLI without excluding 4xx | false budget burn |
| One global SLO for 50 services | nobody is the owner |
| SLO of 100% | impossible to release |
| No record in Git | doc version drift |

---

## In mock-exams

| Material | Course |
|----------|------|
| Brief SLO + lab | [observability-intermediate/07–08](../observability-intermediate/07-slo-sli-sla.md) |
| Example rules | [examples/slo-recording-rules.yml](../observability-intermediate/examples/slo-recording-rules.yml) |
| Mock interview SLO | [observability-advanced/10](../observability-advanced/10-lab-mock-interview.md) |

---

## Interview notes

- The difference between SLI / SLO / SLA.
- Why p99, not average?
- How to compute the budget at 99.9% / 30d?
- An example of a **bad** SLI and how to fix it.
- What is burn rate in one phrase?

---

## Summary

SLI — **facts** about the user experience. SLO — a **goal** agreed with the business. SLA — a **contract** with consequences. Without SLIs you don't manage reliability — you react to noise.

---

## Checklist

- [ ] Write 2 SLIs for one CUJ.
- [ ] Justify the target (not "we just picked 99.9").
- [ ] Define bad for 4xx/429/timeout.
- [ ] Choose a window: rolling vs calendar.
- [ ] Sketch a draft SLO doc.

**Next:** [04. Error budget](04-error-budgets.md).
