# 12. Lab: mock interview — 45 minutes

## Goal

Technical interview simulation: **15 min** rapid-fire, **20 min** system design lite, **10 min** your questions for the interviewer. Partner or timer + voice recording.

## Prerequisites

- [11-interview-qa](11-interview-qa.md) and [interview-cheatsheet](interview-cheatsheet.md) — read **before** the session.
- Paper / whiteboard.

---

## Round 1 — Rapid fire (15 min)

10 questions, **30 seconds** spoken answer each:

1. Why is Redis single-threaded and how do you scale?
2. MOVED vs ASK?
3. `noeviction` vs `allkeys-lru`?
4. Sentinel quorum — why 3?
5. Async replication — what do we lose on failover?
6. Why is `KEYS *` dangerous?
7. Cache stampede — 2 mitigations?
8. Redlock — when not to use it?
9. ACL `~app:*` — what does it mean?
10. Hot key in Cluster — why don’t 6 nodes help?

**Scoring:** ≥7/10 without a cheat sheet — pass.

---

## Round 2 — System design lite (20 min)

**Prompt:** “Marketplace: catalog 2M SKU, 50k RPS read, peaks x3. Sessions 500k online. Redis in EU, PG — source of truth”.

Draw:

- cache-aside flow;
- RAM estimate (order of magnitude);
- standalone vs Cluster vs ElastiCache;
- TTL / eviction;
- session keys pattern;
- hot key mitigation (1 SKU);
- 3 alert metrics;
- security (1 phrase).

**Rubric:**

| 0 | 1 | 2 |
|---|---|---|
| No sizing | RAM ≈ dataset × overhead | + replica/COW headroom |
| One instance “forever” | Cluster for RAM/CPU | + hash tags / sharding |
| No stampede | Mentions jitter | + singleflight |
| Public 6379 | Private + ACL | + TLS + firewall |

≥6/8 — pass. Reference: [14-lab-system-design](14-lab-system-design.md).

---

## Round 3 — Your questions (10 min)

Prepare 3 questions for the company:

- Which Redis (OSS, ElastiCache, MemoryDB, Valkey)?
- Who is on-call and what’s the cache SLO?
- Have there been hot key / OOM incidents?

---

## Homework

Review the recording: filler words, “um” instead of structure **requirement → estimate → diagram → trade-off**.

**Next:** [13. System design](13-system-design.md).
