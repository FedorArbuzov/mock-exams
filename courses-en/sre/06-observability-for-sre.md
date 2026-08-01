# 06. Observability for SRE

## Intro: "we have metrics, but we're blind"

Prometheus collects **thousands** of series; Grafana — **hundreds** of panels; logs — **terabytes**. An incident: "slow". The on-call engineer scrolls through graphs for 40 minutes. It turns out **one** downstream DB connection pool — and there were no alerts on it, because "CPU is normal". **Observability** for SRE is not "accumulate data" but the ability to **answer new questions** in minutes: what broke, where, for whom, from which release.

---

## Three pillars (and three types of signals)

| Pillar | Question | Tool (typically) |
|-------|--------|----------------------|
| **Metrics** | How much? How fast? | Prometheus, CloudWatch |
| **Logs** | What happened in this request? | Loki, ELK, OpenSearch |
| **Traces** | Where is the time in the chain? | Jaeger, Tempo, X-Ray |

**Observability** (in the narrow sense) — the ability to **infer** the internal state from **external** outputs. Monitoring — **predefined** thresholds; observability — **unknown** questions.

Courses: [observability-basic](../observability-basic/README.md) → [intermediate](../observability-intermediate/README.md) → [advanced](../observability-advanced/README.md).

---

## Symptom vs cause

| Alert type | Example | Problem |
|------------|--------|----------|
| Symptom (good) | checkout error rate ↑ | close to the user |
| Cause (context) | Postgres connections 100% | helps **diagnosis** |
| Noise (bad) | CPU > 80% | not actionable |

**Rule:** page a human on a **symptom** + SLO burn; open a **ticket** for a cause if it's not urgent.

---

## RED, USE, the "four golden signals"

**RED** (service): Rate, Errors, Duration — [chapter 02](02-reliability-and-risk.md).

**USE** (resource): Utilization, Saturation, Errors — for a node, disk, DB pool.

**Latency, Traffic, Errors, Saturation** (Google) — close to RED + saturation.

During an incident: **RED of the journey** → drill down into the **USE** of the bottleneck.

---

## Structured logs

```json
{"level":"error","msg":"checkout failed","trace_id":"abc","user_tier":"pro","error":"timeout","dependency":"payments"}
```

- **trace_id** — the link to a trace ([observability-advanced](../observability-advanced/README.md) OTel).
- **Low cardinality** in metric labels; **high detail** in logs.

---

## Dashboards for SRE

| Dashboard | Audience |
|-----------|-----------|
| **Executive / SLO** | budget remaining, availability 30d |
| **Service golden signals** | on-call |
| **Infrastructure** | platform |
| **Release** | version vs error rate (deploy annotations) |

A **single** "everything about everything" dashboard is toil for the eyes.

---

## Cardinality and cost

High cardinality (`user_id` in a label) **kills** Prometheus and the budget. SRE agrees on an **allowlist of labels** with dev. Advanced: [observability-advanced](../observability-advanced/README.md).

---

## Synthetic monitoring

A probe **from the outside** (Blackbox, canary):

| Pro | Con |
|------|-------|
| sees DNS, CDN, TLS | not all user journeys |
| ahead of users | false negatives when the probe IP is blocked |

Complements, but does **not replace**, a real-traffic SLI.

---

## Observability across the whole lifecycle

| Phase | Observability |
|------|----------------|
| Design | "which SLIs?" |
| Build | metrics in the code, trace propagation |
| Deploy | version annotation, compare error rate |
| Incident | dashboards + logs + traces |
| Postmortem | timeline from logs |

---

## In mock-exams

| Sandbox | Course |
|-------|------|
| `deploy/observability` | basic/intermediate labs |
| ServiceMonitor | [kuber-advanced/14](../kuber-advanced/14-observability.md) |
| Kafka lag | [kafka-intermediate/17](../kafka-intermediate/17-monitoring.md) |

---

## Investigation path (playbook)

```text
1. Alert fires (symptom / burn)
2. Open SLO + RED dashboard — scope? (all users vs region)
3. Deploy annotation — correlate release?
4. USE of top dependency — saturated?
5. Logs with trace_id — error class?
6. Trace (if available) — slow span?
7. Mitigate — rollback / scale / flag
8. Scribe timeline for postmortem
```

Time for steps 2–4 is **minutes**, not hours, with good observability.

---

## Exemplars and correlation

Prometheus **exemplars** link a histogram bucket with a **trace_id** — jump from a graph into Jaeger. Even without exemplars: a **single** `trace_id` in a log shrinks the search from "1000 Pods" to "one request".

---

## Observability anti-patterns

| Anti-pattern | Why it hurts |
|-------------|---------------|
| Alert on every panel | fatigue |
| Dashboard without an SLO line | no budget context |
| Logs without levels | can't filter |
| Metrics per user_id label | cardinality explosion |
| "We'll set it up after launch" | PRR fail |

---

## Interview notes

- Monitoring vs observability.
- RED for an API, USE for a node.
- Why page on a symptom?
- How does cardinality kill a TSDB?

---

## Checklist

- [ ] Is there an SLI dashboard, not just infra?
- [ ] Alerts on a symptom or on CPU?
- [ ] trace_id in the logs of a critical path?
- [ ] Who owns the cardinality policy?

**Next:** [07. Alerting and on-call](07-alerting-on-call.md).
