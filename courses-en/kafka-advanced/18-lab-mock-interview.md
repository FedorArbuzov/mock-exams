# 18. Lab: mock interview — 45 minutes

## Goal

Run a **simulation** of a technical interview: 15 min theory rapid-fire, 20 min system design lite, 10 min your questions. A partner or a self-recording with a timer.

## Prerequisites

- [17-interview-qa](17-interview-qa.md) and [interview-cheatsheet](interview-cheatsheet.md) — read **before** the session, not during.
- A sheet of paper / notes.

---

## Round 1 — Rapid fire (15 min)

A partner (or you with a timer) asks **10 questions** from the list, **30 seconds** to answer out loud:

1. What is ISR?
2. Why is consumer count > partition count useless?
3. `acks=all` but `min.insync.replicas=1` — what's wrong?
4. KRaft quorum with 4 nodes — is that OK?
5. Difference between log compaction vs retention delete?
6. EOS in Kafka Streams requires what on the broker?
7. MM2 topic name pattern?
8. ACL deny vs allow priority?
9. Symptom: broker disk at 100% — the first 3 steps?
10. Kafka vs queue for task workers?

**Scoring:** ≥7/10 without peeking — pass.

---

## Round 2 — System design lite (20 min)

**Prompt:** "A SaaS billing system publishes `invoice.created` (5k/s peak). 12 downstream services, Avro, GDPR EU-only, RPO 1h".

Sketch on the whiteboard:

- topics (names, partition estimate);
- Schema Registry placement;
- RF, `min.insync.replicas`;
- one DR region (active-passive);
- monitoring (3 metrics);
- DLQ strategy (1 phrase).

**Rubric (the partner assigns points):**

| 0 | 1 | 2 |
|---|---|---|
| No partition strategy | Key = customerId, N partitions | + hot key mitigation |
| No RF | RF=3 mentioned | + min ISR |
| No DR | MM2 mentioned | + offset sync / RPO math |
| No security | TLS | + ACL per service |

≥6/8 — pass.

Reference ideas: [20-lab-system-design](20-lab-system-design.md).

---

## Round 3 — Behavioral + reverse (10 min)

Prepare a **STAR** answer of 2 minutes: "tell me about an incident with Kafka lag".

Ask the interviewer **3 questions**:

- Which managed Kafka?
- Who is on-call for the broker vs the application?
- How is schema governance set up?

---

## Self-recording

1. Record the screen/audio of round 2.
2. Re-listen — note the **fillers** ("um", "basically") and gaps.
3. Rewrite the answer after 24 h without peeking.

---

## Success criteria

- [ ] Rapid fire ≥7/10.
- [ ] Design rubric ≥6/8.
- [ ] STAR story ready.
- [ ] 3 questions for the employer written down.

**Next:** [19-system-design](19-system-design.md).
