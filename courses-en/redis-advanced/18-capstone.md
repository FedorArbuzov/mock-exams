# 18. Capstone: production-like Redis platform

## Project goal (4–6 hours)

Build a **documented** mini-platform: Redis Cluster on the stand, cache-aside demo, security hardening checklist, OOM/latency runbook, mock **system design** doc — as a portfolio and interview artifact.

## Prerequisites

Chapters **01–17** completed, or equivalent intermediate + this README.

Stand:

```bash
cd deploy/redis
docker compose -f docker-compose.cluster.yml up -d
bash scripts/init-cluster.sh
```

---

## Part A — Cluster operations (90 min)

1. Fill in [`examples/cluster-notes.md`](examples/cluster-notes.md) completely.
2. Simulate failover of one master ([03-lab-cluster](03-lab-cluster.md)) — record RTO.
3. Create 1000 keys `cap:sku:{1..1000}` via pipeline; check slot distribution (sample 5 keys).
4. One key `cap:hot:banner` — `redis-cli --hotkeys` or `INFO commandstats` after 1000 `GET`s in a loop.

**Deliverable:** `cluster-notes.md` + screenshot/output of `CLUSTER INFO`.

---

## Part B — Application pattern (60 min)

Write **pseudocode or a script** (Python/Go/bash) for cache-aside:

- `GET cap:product:{id}`
- on miss: “load from DB” (sleep 0.1) + `SET EX 300`
- TTL jitter ±30s
- optional `SET lock:cap:product:{id} NX EX 10` on miss

Run 20 parallel requests for one id — show that the lock reduces “DB calls”.

**Deliverable:** file `examples/cache-aside-demo.sh` (or description in cluster-notes).

---

## Part C — Security (45 min)

1. Fill the checklist from [08-lab-rename-commands](08-lab-rename-commands.md) for prod.
2. Cross-check with [`examples/redis-security.conf`](examples/redis-security.conf).
3. One paragraph: how [linux-intermediate firewall](../linux-intermediate/07-firewall.md) complements the SG.

**Deliverable:** `## Security` section in cluster-notes or a separate `security-checklist.md` (optional).

---

## Part D — Runbooks (45 min)

Two runbooks of 5–7 steps each:

1. **High latency p99** ([09](09-troubleshooting.md))
2. **OOM / evictions** ([10](10-lab-oom-recovery.md))

**Deliverable:** sections in cluster-notes.

---

## Part E — System design (60 min)

Write 1–2 pages using the [14-lab-system-design](14-lab-system-design.md) template for **your** domain (games, fintech, IoT — your choice):

- sizing RAM
- topology
- hot key plan
- 3 alerts

**Deliverable:** `examples/system-design-capstone.md` (create it yourself).

---

## Part F — Mock interview (30 min)

Complete [12-lab-mock-interview](12-lab-mock-interview.md) with a partner or a recording.

**Deliverable:** self-score ≥7/10 rapid-fire.

---

## Success criteria

| Criterion | Weight |
|----------|-----|
| Cluster ok + failover documented | 25% |
| Cache-aside + anti-stampede | 20% |
| Security checklist | 15% |
| Runbooks | 20% |
| System design doc | 15% |
| Mock interview pass | 5% |

---

## What to say in the interview

“In the capstone I brought up a 6-node Cluster in Docker, ran failover, documented MOVED/ASK, implemented cache-aside with jitter and lock, and wrote an OOM/latency runbook — here’s the repo path `courses/redis-advanced/examples/`.”

---

## Cleanup

```bash
cd deploy/redis
docker compose -f docker-compose.cluster.yml down -v
```

Congratulations — the **redis-advanced** track is complete. Revisit [`interview-cheatsheet.md`](interview-cheatsheet.md).
