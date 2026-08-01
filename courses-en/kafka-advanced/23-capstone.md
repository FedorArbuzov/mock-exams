# 23. Capstone: production-like event platform (4–6 hours)

## Project goal

Build an **end-to-end scenario** at the advanced level: a multi-topic pipeline, cluster ops, a security tabletop, DLQ, a mini design doc, and a **mock interview** self-assessment. Proof of readiness for a senior Kafka interview.

## Prerequisites

Chapters **01–22** completed or equivalent experience. Sandboxes:

- [`deploy/kafka`](../../deploy/kafka/README.md) — single + cluster + optional ZK
- [`kafka-intermediate`](../kafka-intermediate/README.md) — RF, Registry (desirable)
- [`kuber-intermediate: StatefulSet`](../kuber-intermediate/01-statefulset.md) — for the K8s section (written)

---

## Part A — Cluster and reliability (90 min)

1. Bring up a **3-broker** cluster (`docker-compose.cluster.yml`).
2. Create topics:

| Topic | Partitions | RF | min.insync.replicas |
|-------|------------|----|---------------------|
| `capstone.orders` | 12 | 3 | 2 |
| `capstone.orders.enriched` | 12 | 3 | 2 |
| `capstone.orders.dlq` | 6 | 3 | 2 |

3. Producer perf or kcat — **1000+** messages with key `order-{n}`.
4. Stop a broker → capture URP → recovery ([16-lab-urp-recovery](16-lab-urp-recovery.md)).
5. Save a screenshot/log of `describe --under-replicated-partitions` before and after.

**Deliverable:** `docs/ops-runbook.md` (local) — a 1-page URP runbook.

---

## Part B — Pipeline and DLQ (90 min)

1. Produce JSON orders: valid + **10% poison** (`amount:-1`).
2. Simulate enrichment: valid → `capstone.orders.enriched` (kcat or a script).
3. Poison → `capstone.orders.dlq` with a `_dlq.reason` field.
4. Fix the poison batch → **replay** into enriched with **eventId** dedup (tabletop or sqlite).

**Deliverable:** a counts table: in / enriched / dlq / replayed.

---

## Part C — Security & managed (60 min)

1. An ACL matrix for `order-svc`, `analytics`, `admin` ([14-lab-acl-deny](14-lab-acl-deny.md)).
2. An MSK vs Confluent one-pager for the "EU fintech" case ([12-lab-managed-mapping](12-lab-managed-mapping.md)).

**Deliverable:** `security-acl.md` + `managed-choice.md`.

---

## Part D — System design (60 min)

A design doc for the **Notification platform** or your own variant from [20-lab-system-design](20-lab-system-design.md) — full rubric ≥10/12.

**Deliverable:** `design-notification.md`.

---

## Part E — Interview readiness (30 min)

1. Do the [18-lab-mock-interview](18-lab-mock-interview.md) rapid fire.
2. Learn the 10 weakest questions from the [interview-cheatsheet](interview-cheatsheet.md).

**Deliverable:** a "still to review" list (5 bullets).

---

## Part F — K8s (written, 30 min)

Describe how to deploy a **3-broker Kafka** on Kubernetes:

- StatefulSet + Headless Service ([`01-statefulset`](../kuber-intermediate/01-statefulset.md));
- PVC for `log.dirs`;
- podManagementPolicy `OrderedReady`;
- why **not** a Deployment.

**Deliverable:** a half-page ascii diagram.

---

## Submission criteria (self-check)

| # | Criterion |
|---|----------|
| 1 | RF=3 topic, URP incident reproduced |
| 2 | DLQ + replay with idempotency explained |
| 3 | ACL matrix + managed comparison |
| 4 | Design doc ≥10/12 rubric |
| 5 | Mock interview ≥7/10 rapid fire |
| 6 | K8s StatefulSet justification |

---

## Bonus

- Bring up the ZK profile and compare it with KRaft ([05-lab-zookeeper](05-lab-zookeeper.md)).
- Overlay the Schema Registry (`docker-compose.extras.yml`) + an Avro payload.
- Record a 3-min **video** explaining KRaft vs ZK.

---

## After the capstone

- Review [`interview-cheatsheet.md`](interview-cheatsheet.md) a week before the real interview.
- Return to [`kafka-intermediate`](../kafka-intermediate/README.md) if you have gaps in Connect/Registry.

Good luck in the interview.
