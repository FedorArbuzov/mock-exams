# 11. CQRS and read models

## Intro

A single `Order` model for both writes and a report with 12 JOINs is a **bottleneck**. **CQRS** separates the **command side** (changes) and the **query side** (reads), often with different storage.

---

## Command vs Query

| Command | Query |
|---------|-------|
| changes state | reads only |
| validation, invariants | denormalization OK |
| `PlaceOrder` | `GetOrderSummary` |
| usually an OLTP store | may be a cache, search index |

**Not necessarily** different services — sometimes modules in one deploy.

---

## Read model (projection)

```text
OrderPaid event → update order_summary_view
                → update customer_totals_view
                → index in OpenSearch
```

| Projection | Purpose |
|------------|------------|
| List view | admin pagination |
| Dashboard | aggregates |
| Search | full-text |

**Eventual lag** between write and read — document it (seconds?).

---

## When CQRS is justified

| Signal | Example |
|--------|--------|
| Extreme read/write ratio | catalog 1000:1 |
| Different read shapes | mobile vs admin |
| Heavy reports interfere with OLTP | move to a replica/OLAP |

| Not needed | |
|----------|--|
| CRUD 50/50 | ordinary Postgres + indexes |
| Team < 5 | overhead |

---

## Sync CQRS lite

Without events: a **read replica** of Postgres + materialized view refresh ([postgresql-intermediate](../postgresql-intermediate/README.md)).

---

## Invalidation and consistency

| Client's question | Answer |
|----------------|-------|
| "I paid — why is it pending in the list?" | lag + UI polling/SSE |
| "How much is in stock?" | sync read if critical |

Show the **version** or `updated_at` in the UI.

---

## Anti-pattern: CQRS everywhere

Ten projections per entity → an ops nightmare. Start with **one** hot read path.

---

## In mock-exams

| Topic | Course |
|------|------|
| Pagination API | [fastapi/17](../fastapi/17-pagination-filters.md) |
| OpenSearch | [opensearch-basic](../opensearch-basic/README.md) |
| Redis cache | [fastapi/28](../fastapi/28-redis-cache.md) |

---

## Subtasks

**Time:** ~55–65 min.

### 11.1 Read/write split (15 min)

For Catalog: list 3 commands and 5 queries. Which queries are heavy?

### 11.2 Projection design (20 min)

Design `product_list_view` (fields, update source, lag SLA).

### 11.3 CQRS decision (10 min)

A criteria table: your score → CQRS full / lite / no.

### 11.4 UX lag (10 min)

The "order list after payment" scenario — how does the UI handle a 2s lag?

### 11.5 Rejected (10 min)

Why not duplicate all tables into Elasticsearch "just in case"?

---

## Summary

CQRS is a **read-path optimization**, not a religion. Projections + an explicit lag SLA; start with the bottleneck.

---

## Checklist

- [ ] Hot read path identified?
- [ ] Lag SLA for the user?
- [ ] No more than N projections at the start?

**Next:** [12. CAP, eventual consistency](12-consistency-cap.md).
