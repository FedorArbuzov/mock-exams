# 04. Strangler Fig and incremental extraction

## Intro

"We'll rewrite the monolith in a quarter" is a classic failure. **Strangler Fig** (Martin Fowler): new functionality — and gradually the old — gets wrapped in a **facade** until the monolith is "strangled" without a big bang.

---

## Strangler Fig pattern

```text
                    ┌─────────────┐
  Client ──────────►│  Facade /   │
                    │  API GW     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        [New Catalog]  [Monolith]  [New Payment]
              │            │            │
              └────────────┴────────────┘
                    (routing by path/feature)
```

| Phase | Action |
|------|----------|
| 0 | Facade in front of the monolith |
| 1 | New features — in the new service |
| 2 | Migrate the read path (read from the new one, write still in the monolith) |
| 3 | Dual write / sync / events — carefully |
| 4 | Disable the route in the monolith |

---

## Seam — where to cut

| Good seam | Bad seam |
|-------------|------------|
| Few incoming calls | 50 imports from other modules |
| A clear module API | shared ORM models everywhere |
| A separate table/schema already exists | a JOIN across 5 monolith tables |

Tool: a **dependency graph** of modules ([django apps](../django/05-apps-structure.md)).

---

## Branch by abstraction

1. Introduce an **interface** `PaymentPort` in the monolith
2. Implementation v1 — a local module
3. Implementation v2 — HTTP to the Payment svc
4. A feature flag switches the implementation
5. Delete v1

---

## Parallel run (verify)

```text
Request → Monolith (authoritative) + shadow call → New Service
Compare responses in logs (without returning to the client)
```

Only after N days of matches — switch traffic.

---

## Data migration

| Strategy | Description |
|-----------|----------|
| **Bulk copy** | one-off ETL, downtime window |
| **CDC** | Debezium from the monolith → new store |
| **Event backfill** | history via domain events |

Don't extract a service without a plan for the **source of truth** during the transition period.

---

## In mock-exams

| Topic | Course |
|------|------|
| nginx routing | [nginx-basic/04](../nginx-basic/04-reverse-proxy.md) |
| Feature deploy | [gitlab-intermediate](../gitlab-intermediate/README.md) |
| API versioning | [api-design/07](../api-design/07-versioning-compatibility.md) |

---

## Subtasks

**Time:** ~55–65 min.

### 4.1 Choosing the first seam (15 min)

From the context map (ch.02), pick a module for strangler #1. Table: incoming dependencies | outgoing | complexity score 1–5.

### 4.2 Routing plan (15 min)

Describe the facade rules: which `path`/`Host`/`header` go to the monolith vs the new service. Example for `/api/v1/catalog/*`.

### 4.3 Branch by abstraction (15 min)

Name 1 interface (port) in the monolith and 2 implementations (local / remote). Who flips the feature flag?

### 4.4 Parallel run (10 min)

What do you compare (status code, body hash, latency)? How many days of shadow before cutover?

### 4.5 Rollback (10 min)

One scenario: the new service goes down — how do you return 100% to the monolith in 5 minutes?

---

## Summary

Migration is **routing + data + flags**, not a rewrite. Strangler minimizes the big bang; parallel run reduces fear.

---

## Checklist

- [ ] Facade/route described?
- [ ] Rollback without deploying the monolith?
- [ ] Data source of truth clear at every phase?

**Next:** [05. Synchronous communication](05-sync-communication.md).
