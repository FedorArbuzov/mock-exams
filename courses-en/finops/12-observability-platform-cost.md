# 12. Observability and platform cost

## Intro

Prometheus + Loki + Jaeger + CloudWatch Logs are **not free** as cardinality and retention grow. Observability FinOps balances **debuggability** vs **$**.

Related: [observability-advanced/05-cardinality-cost](../observability-advanced/05-cardinality-cost.md).

---

## Metrics (Prometheus / AMP / CloudWatch)

| Cost driver | Lever |
|--------------|--------|
| High cardinality labels | `user_id`, `trace_id` in labels — **no** |
| Scrape interval 5s | 15–60s for non-critical |
| Long retention | recording rules + downsample |
| Remote write $ | sample filtering |

**Recording rules** — pre-aggregate for dashboards ([observability-intermediate/01](../observability-intermediate/01-recording-rules.md)).

---

## Logs

| Driver | Lever |
|---------|--------|
| Verbose debug in prod | level INFO/WARN |
| Full body logging | sampling |
| CloudWatch Logs ingest $/GB | retention 7–30d |
| Loki | label cardinality like Prometheus |
| Cross-region shipping | local ingest |

---

## Traces

- Head-based sampling 1–10% for high RPS.
- Tail-based sampling (more infra cost, less waste) — for critical paths.
- Trace retention << logs.

---

## Platform shared cost

GitLab runners, Argo CD, ingress controllers — **shared services**:

- allocate by % of workloads or `team` label
- include in **platform unit cost** ($/developer/month)

---

## Reliability vs cost (SRE link)

| Cheaper | More expensive, but needed |
|---------|------------------|
| Less retention | Compliance 1y audit |
| Fewer alerts | Burn rate SLO pages |
| Self-hosted Prometheus | Managed AMP ops time |

[sre/15](../sre/15-economics-of-reliability.md) — don’t cut monitoring first under budget pressure without a risk assessment.

---

## In mock-exams

[deploy/observability](../../deploy/observability/README.md) — estimate disk growth under `traffic.sh` for 24h. Kubecost + Prometheus stack on mockctl — double resource accounting.

---

## Summary

Observability FinOps = **cardinality discipline**, retention tiers, sampling. Platform tools — an explicit line in showback.

---

## Checklist

- [ ] Are high-cardinality labels banned in the style guide?
- [ ] Does retention differ by data type?
- [ ] Is shared monitoring cost allocated?

**Next:** [13. Lab budgets/tags](13-lab-budgets-tags.md).
