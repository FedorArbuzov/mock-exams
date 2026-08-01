# 08. Database per service and data ownership

## Intro

Two microservices and one `orders` table is a **distributed monolith** with network latency. **Database per service** — each service owns its **private** storage; other services' data is accessed via an API or events.

---

## The ownership principle

| Rule | Consequence |
|---------|-----------|
| Only the owner writes | no cross-service SQL UPDATE |
| Others' data — read via a contract | API, materialized view, replica read model |
| Schema is hidden | no shared ORM models between repos |

---

## Shared database anti-pattern

```text
[Order Svc]──┐
             ├──► [PostgreSQL orders + inventory tables]
[Inventory]──┘
```

| Problem | Example |
|----------|--------|
| Coupled migrations | the Order team breaks Inventory |
| Unclear owner | who fixes a deadlock |
| Scale | can't shard inventory separately |

---

## Patterns for accessing others' data

| Pattern | When |
|---------|-------|
| **Sync API** | little data, freshness required |
| **Local cache/replica** | read-heavy, lag acceptable |
| **Event replication** | updates rare, fan-in |
| **API composition** | the BFF assembles on the fly |

---

## DB types per service (polyglot persistence)

| Service | Store | Why |
|--------|-------|--------|
| Catalog | Postgres + Redis cache | ACID + speed |
| Search | OpenSearch | full-text |
| Session cart | Redis | TTL |
| Analytics | ClickHouse / warehouse | OLAP |

The cost: **ops expertise** across N systems ([postgresql-*](../postgresql-basic/README.md), [opensearch-*](../opensearch-basic/README.md)).

---

## Transition period (strangler)

| Phase | Data |
|------|------|
| 1 | Shared DB, different schemas/prefixes |
| 2 | Read-only views for others |
| 3 | Separate cluster + sync |
| 4 | Full separation |

Explicitly record the **phase** in the ADR — don't get stuck on phase 1 for years.

---

## In mock-exams

| Topic | Course |
|------|------|
| Postgres per app | [deploy/fastapi](../../deploy/fastapi/README.md), [deploy/django](../../deploy/django/README.md) |
| N+1 cross aggregate | [sqlalchemy-deep/16](../sqlalchemy-deep/16-lab-n-plus-one.md) |
| Redis cache-aside | [redis-basic](../redis-basic/README.md) |

---

## Subtasks

**Time:** ~55–65 min.

### 8.1 Data ownership map (20 min)

Table: entity (Order, Product, Payment) | owning service | storage | who reads others' data (how).

### 8.2 Shared DB audit (10 min)

If it's a monolith now — are there JOINs between "future" services? List 3 dangerous JOINs.

### 8.3 Read model (15 min)

The Order svc needs the Inventory catalog. Pick: sync API / cache / event replica. A ½-page ADR.

### 8.4 Migration phase (10 min)

For one entity, describe phases 1–4 (from the section above) with target dates.

### 8.5 Polyglot (10 min)

Does one service need a second DB type? Which one and why (or "no, YAGNI").

---

## Summary

A microservice without its own data boundary is a **module with HTTP**. Data ownership costs more than REST, but is cheaper than a shared schema.

---

## Checklist

- [ ] Does every entity have one owner?
- [ ] No cross-service SQL?
- [ ] Transition phase recorded?

**Next:** [09. Saga: orchestration and choreography](09-saga-patterns.md).
