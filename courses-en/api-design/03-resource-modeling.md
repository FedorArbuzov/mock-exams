# 03. Resource and URL modeling

## Intro

URLs live for years: they get logged, cached, and baked into mobile apps. A bad resource model costs more than "the wrong framework" — changing paths after release is painful.

---

## Nouns, not verbs

```text
Good                            Bad
──────                          ─────
GET  /users/{id}                GET  /getUser?id=...
POST /orders                    POST /createOrder
POST /orders/{id}/cancel        GET  /cancelOrder?orderId=...
```

Exception: **actions** that don't fit into a resource's fields — `POST /payments/{id}/capture` (capture is a state-machine transition).

---

## Collections and items

```text
/orders              collection
/orders/{order_id}   item
/orders/{order_id}/items   nested collection
```

| Pattern | When |
|---------|-------|
| Nested URL | the item **belongs to** the parent; meaningless without it |
| Flat URL `/order-items?order_id=` | you need cross-order queries, an admin panel |
| Both | v1 nested, v2 flat + filter (with a migration guide) |

**Rule:** if `GET /items/{id}` is enough — don't force the client to know the `order_id`.

---

## Identifiers

| Type | Example | Pros / cons |
|-----|--------|----------------|
| Auto-increment int | `42` | simple; leaks volume; weak federation |
| UUID v4 | `550e8400-e29b-...` | unpredictable; long URL |
| ULID / KSUID | `01ARZ3NDEKTSV4RRFFQ69G5FAV` | sortable by time |
| Slug | `acme-corp` | readable; a rename breaks the URL |
| Prefixed id | `ord_01H...` | type in logs, Stripe-style |

**Public API:** an opaque string id; do **not** expose the internal DB surrogate key without need.

---

## Many-to-many relationships

```text
/users/{id}/groups          membership as a sub-resource
/groups/{id}/users
```

Duplicating entry points is acceptable if access is **symmetric** (a group admin vs a user profile). Document the canonical path for writes.

---

## Bulk operations

| Approach | Example |
|--------|--------|
| Batch endpoint | `POST /orders/batch` with an array |
| Async job | `POST /imports` → `202` + `job_id` — [11-async-webhooks](11-async-webhooks.md) |
| Multiple PATCHes | on the client — if the volume is small |

Don't do `GET /orders?ids=1,2,3,...,500` for mutations.

---

## Search and filtering

```http
GET /products?q=laptop&category=electronics&sort=-price&limit=20
```

- **Filters** — query params on a collection ([05-pagination-filtering](05-pagination-filtering.md))
- **Complex search** — `POST /products/search` with a body (careful: not cached like GET)

---

## Version in the URL

```text
/api/v1/orders
/api/v2/orders
```

The `/api/v1` prefix is a practical default ([07-versioning-compatibility](07-versioning-compatibility.md)). Resources **within** a version are stable.

---

## Naming conventions

| Decision | Recommendation |
|---------|--------------|
| `kebab-case` vs `snake_case` in the path | **kebab-case** in URLs: `/order-items` |
| JSON fields | **snake_case** (Python/Postgres) or **camelCase** (JS) — **one** per API |
| Plural | `/orders`, not `/order` |
| Trailing slash | pick a policy; a 301 redirect or a 404 on mismatch |

---

## In mock-exams

| Topic | Course |
|------|------|
| Resource CRUD | [fastapi/06](../fastapi/06-lab-crud.md), [django/07](../django/07-models-basics.md) |
| Nested serializers | [django/24](../django/24-lab-serializers.md) |
| APIRouter prefix | [fastapi/08](../fastapi/08-project-structure.md) |

---

## Summary

A URL is a **domain model**, not a 1:1 reflection of DB tables. Collections, stable ids, and explicit nesting and naming rules lower the cost of v2.

---

## Checklist

- [ ] Are there verbs in the path?
- [ ] Are ids public and unpredictable?
- [ ] Does nesting reflect ownership?

**Next:** [04. OpenAPI: contract-first and code-first](04-openapi-contracts.md).
