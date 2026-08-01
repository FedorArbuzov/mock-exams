# 12. System design and interviews

## Intro

The task: "Design order notifications for 1M orders/day". The interviewer expects **questions** and **trade-offs**, not "Kafka".

---

## Answer framework (8 steps)

1. **Clarify** — volume, latency, ordering, cloud, replay?
2. **Users** — who are the producers/consumers?
3. **Model** — task vs event?
4. **Shortlist** 2–3 brokers.
5. **Pick** with a table.
6. **Deep dive** — partitions, DLQ, idempotency.
7. **Failure** — broker down, duplicate, lag.
8. **Observability** — lag, DLQ depth, age.

---

## Example cases

### Email after an order (at-least-once OK)

| Option | Pro |
|---------|------|
| SQS + Lambda | simple in AWS |
| Rabbit work queue | routing priority |
| Kafka | overkill without analytics |

**Answer:** SQS or Rabbit; idempotent email send.

### Analytics + billing on all orders

**Kafka** (or Kinesis) — several groups; 30d retention.

### "Forward all of yesterday's orders to a new service"

Only a **log** (Kafka). SQS/Rabbit **don't fit**.

### Low-latency in-app notify

Redis Pub/Sub or Streams; **not** a Kafka path for a UI tick.

---

## Interview questions (cheat sheet)

| Question | Core of the answer |
|--------|-------------|
| Is Kafka a queue? | log, offset, retention |
| SQS vs SNS? | pull queue vs push fan-out |
| How to scale Kafka consumption? | partitions = parallelism |
| Duplicate? | at-least-once + idempotent |
| Rabbit vs Kafka? | routing/tasks vs replay/log |
| Redis Streams vs Kafka? | scale, retention, ecosystem |

---

## Bad answers

- "Kafka everywhere"
- "SQS doesn't scale"
- "Exactly-once everywhere"
- Ignoring **ops** and **cost**

---

## Summary

System design is a **justified choice**, not logo picking.

---

## Checklist

- [ ] Can you walk through one case out loud in 15 minutes?
- [ ] Did you draw a diagram of producer → bus → consumers?
- [ ] Did you name DLQ and idempotency?

**Next:** [13. Ops and cost](13-ops-cost-observability.md).
