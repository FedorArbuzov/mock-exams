# 10. Capacity, performance, and cost

## Intro: "on Friday there are twice as many people"

Marketing launched a promotion without warning. RPS grew **3×** in an hour. HPA added Pods, but **Postgres connections** hit the limit; **Kafka** lag grew; the **Ingress** became CPU-throttled. The team buys **more nodes**, but the bottleneck is **one** pool in the application. SRE should have known **in advance**: the **headroom**, the **limiting resource**, the **cost** of the next nine.

**Capacity planning** is not "buy servers" but a **forecast**: will the system suffice at **peak + margin** until the next planning cycle.

---

## Performance vs capacity

| | Performance | Capacity |
|---|-------------|----------|
| Question | "How fast at the **current** load?" | "Can we handle **more** load?" |
| Metrics | latency p99, throughput | headroom, saturation |
| Action | tuning, indexes | scale out, shard |

Both are connected: poor performance at 50% load is a capacity crisis **soon** at 100%.

---

## The demand → supply model

```text
Demand (RPS, users, data growth)
        │
        ▼
   Service tier (app, cache, queue)
        │
        ▼
   Resource tier (CPU, RAM, disk IOPS, network)
        │
        ▼
   Cost ($)
```

SRE builds a **capacity plan** for the critical path ([chapter 03](03-sli-slo-sla.md) CUJ).

---

## Load testing

| Type | Goal |
|-----|------|
| **Load** | expected peak + margin |
| **Stress** | find the breaking point |
| **Soak** | leaks over 24–72h |
| **Spike** | a sudden x2 RPS |

**Before production:** on staging with **realistic** data; **in prod** — only with guardrails and a window (rarely).

Tools: k6, Locust, Gatling; for K8s — [kuber-intermediate/17-hpa](../kuber-intermediate/17-hpa.md).

---

## Headroom and N+1

| Concept | Rule (guideline) |
|---------|-------------------|
| **Headroom** | 30–50% CPU/RPS reserve for the peak |
| **N+1** | losing one node/AZ doesn't break the SLO |
| **Overcommit** | in K8s — deliberately, with limits |

**Saturation** ([USE](02-reliability-and-risk.md)): the queue grows → latency grows **before** CPU hits 100%.

---

## Scaling

| Direction | When | Example |
|-------------|-------|--------|
| **Vertical** | quick fix, DB | more RAM on RDS |
| **Horizontal** | stateless app | HPA, replicas |
| **Sharding** | data limit | partition by user_id |
| **Async** | burst absorb | queue ([kafka](../kafka-basic/README.md)) |

**Stateful** is harder: [postgresql-intermediate](../postgresql-intermediate/README.md) replication, a connection pooler.

---

## Seasonality and forecasting

| Source of growth | Planning |
|----------------|--------------|
| Marketing | a campaign calendar |
| Organic | 90d RPS trend |
| A new region | a users multiplier |
| A feature release | dev estimate + canary metrics |

A **quarterly** capacity review: actual vs forecast, adjusting purchases.

---

## Cost of reliability

Every replica, AZ, standby is **money**. [Chapter 15](15-economics-of-reliability.md) goes deeper into the trade-off. Capacity without cost is **over-provisioning**.

| Decision | Cost driver |
|---------|-------------|
| Multi-region active-active | 2×+ infra |
| Over-provisioned RDS | idle CPU bill |
| Log retention 365d | storage |

**FinOps** partnership: tagging, rightsizing, committed use.

---

## Capacity of dependencies

| Dependency | Risk |
|------------|------|
| SaaS API | vendor limits |
| Cloud quota | API rate, IP limits |
| Certificate expiry | not capacity, but an outage |
| License | seats, throughput tier |

Runbook: "request a quota increase N weeks before launch".

---

## In mock-exams

| Topic | Course |
|------|------|
| HPA | [kuber-intermediate/17](../kuber-intermediate/17-hpa.md) |
| Redis memory | [redis-intermediate](../redis-intermediate/README.md) |
| Kafka partitions | [kafka-intermediate](../kafka-intermediate/README.md) |
| Postgres | [postgresql-performance](../postgresql-performance/README.md) |

---

## Checklist

- [ ] Do you know the peak RPS over 90 days?
- [ ] A load test before a major promotion?
- [ ] Is the limiting resource named (not "everything")?
- [ ] Headroom for an AZ failure?

**Next:** [11. Changes as the main risk](11-change-and-release.md).
