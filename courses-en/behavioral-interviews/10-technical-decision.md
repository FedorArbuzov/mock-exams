# 10. Technical decision and trade-off

## Intro

Behavioral + tech: "Tell me about a hard technical decision". They're testing **judgment**, not syntax. It fits perfectly with ADRs and the mock-exams courses.

---

## Structure

```text
Problem  — the pain, constraints (latency, team, budget)
Options  — 2–3 variants (monolith split, Kafka vs SQS, sync vs async)
Decision — criteria, who decided
Outcome  — metrics, surprises
Learning — what you know now
```

Sources: [api-design](../api-design/README.md), [messaging-deep/14](../messaging-deep/14-synthesis.md), capstone.

---

## Example topics

| Topic | Trade-off |
|------|-----------|
| Outbox vs dual write | consistency vs complexity |
| Cursor vs offset pagination | UX vs DB load |
| Redis cache | staleness vs speed |
| K8s vs managed PaaS | ops vs cost |

---

## Subtasks

**Time:** ~60 min.

### 10.1 ADR in STAR (30 min)

One decision from work or a capstone in SOAR.

### 10.2 Rejected option (15 min)

Why you did **not** pick the popular option (microservices day one, etc.).

### 10.3 2-min pitch (15 min)

Out loud for a non-technical hiring manager.

---

## Checklist

- [ ] ≥2 options?
- [ ] Are the criteria explicit?

**Next:** [11. Teamwork](11-teamwork-mentoring.md).
