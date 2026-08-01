# 20. Lab: system design — "Notification platform"

## Goal

Write a **design doc** of 2–3 pages of Markdown (a local file `my-design.md`, not in the repository) for the case below. Cross-check against the rubric.

## Case

A **Notification platform** for a fintech:

- Sources: `payment.completed`, `kyc.verified`, `fraud.flagged`.
- Channels: email, SMS, push (separate workers).
- Peak: **8k events/s**, average 800/s.
- Payload: 1–4 KB JSON → Avro migration planned.
- **Regulatory:** audit trail for 7 years (cold storage acceptable).
- **SLA:** 95% of notifications < 30s from event time.
- Team: 3 backend, 1 platform.

---

## Task 1. Requirements doc (½ page)

Split into:

- Functional (bullets)
- Non-functional (latency, durability, compliance)
- Out of scope (explicit)

---

## Task 2. Capacity (½ page)

Calculate:

- partition count recommendation per topic;
- rough disk/month with RF=3, 7y only for the audit topic (tiered OK);
- number of consumer instances per channel (upper bound).

---

## Task 3. Diagram

Mermaid or ascii:

- 3 source topics minimum;
- routing / enrichment;
- DLQ per channel;
- Schema Registry;
- metrics.

---

## Task 4. Failure scenarios (table)

| Scenario | Impact | Mitigation |
|----------|--------|------------|
| Broker AZ down | | |
| Schema incompatible deploy | | |
| SMS provider 500 | | |
| Consumer stuck (poison) | | |

At least **6 rows**.

---

## Task 5. Security & multi-tenancy

- ACL: who writes `payment.*`?
- PII in the payload — masking in logs?
- Separate cluster dev/stage/prod?

---

## Rubric (self / peer assessment)

| Criterion | 0–2 |
|----------|-----|
| Partition/key strategy | |
| DLQ + idempotency | |
| Retention/tiered for 7y | |
| Observability | |
| Realistic staffing | |

**10–12** — strong hire level for the design round.

---

## Reference elements (after your own attempt)

- Topic per domain event; **key** = `userId` for ordered notifications per user.
- **Fraud** fast path — a separate consumer group with a priority topic.
- **DLQ** `notifications.{channel}.dlq` + a replay tool.
- **audit** topic → S3 via Connect + tiered Kafka 30d hot.
- Lag alert + URP alert on the cluster.
- Idempotency: `notificationId` dedup store (Redis/DB).

---

## Success criteria

- [ ] Design doc 2+ pages.
- [ ] Rubric ≥10.
- [ ] 6 failure rows.

**Next:** [21-poison-dlq-replay](21-poison-dlq-replay.md).
