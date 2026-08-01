# 10. Lab: mock interview — 45 minutes

## Goal

Simulate a technical interview: **15 min** rapid-fire, **20 min** system design lite, **10 min** your questions for the interviewer.

## Prerequisites

- [09-interview-qa](09-interview-qa.md) and [interview-cheatsheet](interview-cheatsheet.md) — read **before** the session.
- Whiteboard / paper.

---

## Round 1 — Rapid fire (15 min)

10 questions, **30 seconds** to answer out loud:

1. The three pillars of observability?
2. How does a trace differ from a log?
3. What is cardinality?
4. RED vs USE?
5. Why kube-state-metrics?
6. ServiceMonitor — why?
7. Why an OTel Collector?
8. Head sampling vs tail sampling?
9. What is `rate()` for?
10. Why isn't `user_id` in labels?

**Score:** ≥7/10 without the cheatsheet — pass.

---

## Round 2 — System design lite (20 min)

**Prompt:** "E-commerce API, 200 microservices, 80k RPS peak, multi-AZ AWS + EKS. Need SLO 99.95%, on-call < 15 min MTTA."

Draw:

- where metrics/logs/traces are collected;
- OTel deployment (agent/collector);
- 3 SLIs and SLOs;
- cardinality policy (1 example of a ban);
- alert routing (Alertmanager vs CloudWatch);
- Redis cache layer — which **2** signals ([redis-intermediate/15](../redis-intermediate/15-monitoring.md));
- retention and cost knob.

**Rubric:**

| 0 | 1 | 2 |
|---|---|---|
| One Prometheus for everything without HA | HA Prometheus / AMP | + federation/tenant |
| No sampling | "1% head" | + tail errors |
| Logs without trace_id | Mentioned correlation | + standard schema |
| 50 alerts for everything | SLO burn | Actionable + runbook |

≥6/8 — pass. Reference: [12-lab-system-design](12-lab-system-design.md).

---

## Round 3 — Your questions (10 min)

Prepare 3 questions for the company:

1. Which traces backend (Jaeger/Tempo/X-Ray)?
2. Who owns the cardinality guidelines?
3. How is on-call set up (rotation, game days)?

---

## After the session

- [ ] Wrote down weak topics → review chapters 01, 05, 07, 11
- [ ] Updated the cheatsheet with your own phrasing

Next lesson: [11-system-design-observability.md](11-system-design-observability.md).
