# 12. Lab: system design observability

## Goal

Write a **1–2 page** design doc following the staff-interview template; peer review against the rubric.

## Prerequisites

- [11-system-design-observability](11-system-design-observability.md)
- [10-lab-mock-interview](10-lab-mock-interview.md) completed (recommended)

---

## Pick a prompt (one)

### A. Fintech payments

99.99% SLO, PCI — no PAN in logs, EU region, EKS + Lambda authorizer.

### B. Gaming realtime

50k RPS, latency p99 < 100ms, Redis sessions, traces heavy — sampling strategy?

### C. Internal platform

200 services, 20 teams, limited SRE, must use existing CloudWatch.

---

## Document structure

Create `my-observability-design.md` (locally, committing is not mandatory):

### 1. Requirements (½ page)

- 3 SLIs / 2 SLOs
- Compliance / retention

### 2. Diagram (½ page)

Mermaid or ASCII: apps → OTel → backends → alerting → on-call.

### 3. Metrics plan (½ page)

- RED per service
- 5 **allowed** labels
- 3 **forbidden** labels

### 4. Logs & traces (½ page)

- Log schema (fields)
- Sampling % head + tail rule
- `trace_id` correlation

### 5. K8s & AWS (½ page)

- kube-prometheus-stack role ([03](03-kube-prometheus.md))
- CloudWatch for Lambda ([19](../aws-intermediate/19-cloudwatch.md)) — what exactly

### 6. Redis / datastore (¼ page)

- 2 alerts, 2 debug commands from [redis-intermediate/15](../redis-intermediate/15-monitoring.md)

### 7. Cost & risks (¼ page)

- 3 cost knobs
- 2 failure modes + mitigation

---

## Rubric (self-score / peer)

| Criterion | 0 | 1 | 2 |
|----------|---|---|---|
| SLO measurable | No | Yes, without SLI | SLI+SLO+budget |
| Cardinality | Ignored | Mentioned | Denylist + relabel |
| Traces | "Jaeger" | + sampling | + propagation/async |
| On-call | "Alerts" | AM/CW | Runbooks + severity |
| Hybrid AWS | k8s only | CW logs | CW alarms + EKS metrics |
| Redis | No | Metrics | INFO/SLOWLOG + trace |

**Pass:** ≥9/12.

---

## Reference talking points (don't copy blindly)

- OTel Collector central + DaemonSet agent
- Prometheus HA 2 replicas + Thanos/Mimir optional
- Alertmanager → PagerDuty; CW → SNS for Lambda
- 1% head sampling + tail on `status=error` or `duration>p99`
- Runbook URL in every alert annotation

---

## Success criteria

- [ ] Document following structure 1–7
- [ ] Self-score ≥9/12
- [ ] Peer review: 1 comment addressed

Next lesson: [13-on-call-capstone.md](13-on-call-capstone.md).
