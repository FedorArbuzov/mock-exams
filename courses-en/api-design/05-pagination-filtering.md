# 05. Lists: pagination, filters, sorting

## Intro

`GET /orders` returned 2 million records — both the server and the mobile client crashed. A list is its own **contract**: how to slice the data, how to filter, and how not to break DB performance.

---

## Offset vs cursor

| | Offset `?page=3&limit=20` | Cursor `?cursor=eyJ...&limit=20` |
|--|---------------------------|-----------------------------------|
| UX | "page 5 of 100" | "the next chunk" |
| Stability under inserts | duplicates/gaps | more stable with a sort key |
| DB | `OFFSET` is expensive at large N | `WHERE id > $cursor` |
| Jump to page | yes | no (without a separate API) |

**Recommendation:** offset for admin panels with small volumes; **cursor** for public feeds and high-volume.

---

## List response format

**Envelope style (popular):**

```json
{
  "data": [ { "id": "ord_1", "status": "paid" } ],
  "pagination": {
    "next_cursor": "eyJpZCI6MTIzfQ",
    "has_more": true,
    "limit": 20
  }
}
```

**Headers style:**

```http
Link: <.../orders?cursor=abc>; rel="next"
X-Total-Count: 1542
```

Pick one style per API; don't mix them without a version.

---

## Filtering

```http
GET /orders?status=paid&created_after=2024-01-01T00:00:00Z&customer_id=cus_42
```

| Rule | Example |
|---------|--------|
| Field names = the public model | `status`, not `order_status` from the DB |
| Dates in ISO 8601 UTC | `2024-06-01T12:00:00Z` |
| Multiple values | `?status=paid,shipped` or repeated `?status=paid&status=shipped` — document it |
| Ranges | `price_min=10&price_max=100` |

**Complexity limit:** a whitelist of filters — not arbitrary SQL from the query string.

---

## Sorting

```http
GET /orders?sort=-created_at,status
```

| Convention | Meaning |
|-----------|----------|
| `-field` | descending |
| `field` | ascending |
| Multiple fields | comma-separated |

A default sort is **mandatory** in the docs (usually `-created_at`).

---

## Fields and sparse fieldsets

```http
GET /orders?fields=id,status,total
```

Reduces the payload; harder in OpenAPI — optional for v2.

---

## Including relations (expand)

```http
GET /orders/42?expand=customer,items
```

A GraphQL alternative for 1–2 levels of nesting. Watch out for N+1 — [postgresql-developer](../postgresql-developer/README.md), [sqlalchemy-deep/16](../sqlalchemy-deep/16-lab-n-plus-one.md).

---

## Limits

| Parameter | Typical default | Max |
|----------|------------------|-----|
| `limit` | 20 | 100 (a hard cap) |
| Expand depth | 1 | 2 |
| `q` search length | — | 200 characters |

Exceeding the limit → **clamp** to max, not a 400 (or a 400 — but stated explicitly in the spec).

---

## DB indexes

Every filter + sort in a public API must have an **index plan**:

```sql
CREATE INDEX idx_orders_status_created ON orders (status, created_at DESC);
```

Otherwise pagination becomes an incident on Black Friday.

---

## In mock-exams

| Topic | Course |
|------|------|
| Pagination in FastAPI | [fastapi/17](../fastapi/17-pagination-filters.md), [18-lab](../fastapi/18-lab-pagination.md) |
| DRF pagination | [django/27–28](../django/27-filtering-pagination.md) |
| N+1 | [sqlalchemy-deep/15–16](../sqlalchemy-deep/15-eager-loading.md) |

---

## Summary

A list is a **product interface**, not `SELECT *`. Cursor for scale, a whitelist of filters, an explicit sort, a cap on limit.

---

## Checklist

- [ ] Is there a max `limit`?
- [ ] Is the default sort documented?
- [ ] Are filters backed by indexes?

**Next:** [06. Errors and Problem Details](06-errors-problem-details.md).
