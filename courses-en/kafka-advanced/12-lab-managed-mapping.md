# 12. Lab: MSK vs Confluent — comparison table (exercise)

## Lab goal

Fill in a **decision matrix** for a fictional case (as in a system design round). There's no cloud account — we work on paper / in Markdown. The result is a well-argued recommendation in 30 minutes.

## Prerequisites

- [11-managed-kafka](11-managed-kafka.md).
- Read the case requirements below.

---

## Case: "Marketplace EU"

| Requirement | Value |
|------------|----------|
| Cloud | AWS only (eu-central-1, eu-west-1) |
| Peak ingress | 120 MB/s |
| Retention | 30 days, ~50 TB logical |
| Consumers | 40 microservices (Java), 5 Flink jobs |
| Compliance | GDPR, data in EU |
| Team | 2 platform engineers |
| DR | RPO 15 min, RTO 2 h |
| Budget | medium, not unlimited |
| Schema | Avro + Registry required |
| SQL analytics | desirable, not a blocker |

---

## Task 1. Criteria table

Copy and fill it in (✓ / ~ / ✗ or 1–5):

| Criterion | MSK | Confluent Cloud | Strimzi on EKS |
|----------|-----|-----------------|----------------|
| Time to prod (2 FTE) | | | |
| EU data residency | | | |
| IAM auth for apps | | | |
| Managed Connect | | | |
| Schema Registry | | | |
| ksql / Flink hosting | | | |
| Multi-region DR | | | |
| Predictable cost | | | |
| Ops at 120 MB/s | | | |
| Upgrade Kafka version | | | |

**Reference notes (don't peek before filling in):**

- MSK: strong IAM, Registry via a Confluent partner or a self-run CP Schema Registry on ECS — clarify in your answer.
- Confluent: Registry + ksql out of the box, PrivateLink between regions.
- Strimzi: 2 FTE at 120 MB/s — a **risk** without 24/7 SRE.

---

## Task 2. Choice and one-pager

Write **half a page**:

1. A recommendation (one primary, one fallback).
2. Three **risks** and mitigation.
3. A bootstrap and auth scheme (1 ascii diagram).

Example opening:

```text
We recommend MSK Provisioned in eu-central-1 as primary + MM2 in eu-west-1 for DR...
```

---

## Task 3. Questions for the interviewer

Come up with **5 clarifying questions** you would ask product before choosing:

- do we need active-active writes in both regions?
- is the Confluent vendor acceptable?
- is there already an EKS cluster?

---

## Task 4. Self-check rubric

| Point | Criterion |
|------|----------|
| 1 | The table is filled with no empty rows |
| 1 | RPO/RTO are accounted for (MM2 / Cluster Linking) |
| 1 | Cross-AZ cost is mentioned |
| 1 | Schema Registry is not "forgotten" |
| 1 | Staffing is honestly assessed (2 FTE) |

---

## Example reference conclusion (cross-check)

**Primary: MSK Provisioned** + **Glue Schema Registry** or a **hosted Confluent Schema Registry** + **Flink on EMR/EKS** for heavy analytics.

**Fallback: Confluent Cloud** if buying ksql + governance is faster than hiring Flink ops.

**Not Strimzi** with 2 FTE unless the team declines managed — make the argument.

---

## Success criteria

- [ ] The table is filled in independently.
- [ ] A one-pager with risks.
- [ ] 5 questions for product.

**Next:** [13-security-advanced](13-security-advanced.md).
