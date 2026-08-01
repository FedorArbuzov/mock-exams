# 02. HTTP: methods, status codes, safe and idempotent

## Intro

A client retried a request after a timeout. The server returned `200` with a body of "error: out of stock". This isn't an "HTTP detail" — it's a **contract** that breaks integrations and the retry logic of SDKs.

---

## HTTP methods

| Method | Safe | Idempotent | Typical use |
|-------|------|------------|------------------------|
| **GET** | yes | yes | reads, lists |
| **HEAD** | yes | yes | metadata without a body |
| **PUT** | no | yes | full replacement of a resource by URL |
| **PATCH** | no | * | partial update |
| **POST** | no | no | creation, actions, search (with care) |
| **DELETE** | no | yes | deletion |

\* PATCH is idempotent **if** the semantics are "set field X to Y", not "add 1 to a counter".

```text
Safe       = doesn't change server-side state (GET must not charge money)
Idempotent = a repeat has the same effect as a single call
```

---

## Choosing a method for operations

| Operation | Method | URL |
|----------|-------|-----|
| List orders | GET | `/orders` |
| A single order | GET | `/orders/{id}` |
| Create an order | POST | `/orders` |
| Replace an entire order | PUT | `/orders/{id}` |
| Update status | PATCH | `/orders/{id}` |
| Delete | DELETE | `/orders/{id}` |
| Cancel (an action) | POST | `/orders/{id}/cancel` **or** PATCH `status=cancelled` |

**Two cancellation styles:** the sub-resource `POST .../cancel` (an explicit action) vs a PATCH of the `status` field (a resource model). Pick one and document it.

---

## Status codes — the minimal set

| Code | When |
|-----|-------|
| **200** | OK with a body (GET, PATCH, PUT) |
| **201** | Created; `Location: /orders/42` header |
| **204** | OK with no body (DELETE, sometimes PATCH) |
| **304** | Not Modified (ETag cache) |
| **400** | Request syntax/semantics (client-fixable) |
| **401** | Not authenticated |
| **403** | Authenticated, but no permission |
| **404** | Resource not found **or** hidden from outsiders (watch out for leaks) |
| **409** | Conflict (duplicate, version, state machine) |
| **422** | Field validation (common in JSON APIs; debated against 400 in pure REST) |
| **429** | Rate limit |
| **500** | An unexpected server error |
| **502/503/504** | Proxy/upstream/timeout — the client **may** retry |

**Anti-pattern:** always `200` + `{ "success": false }` — it breaks monitoring, caching, and HTTP clients.

---

## GET with side effects

```http
GET /orders/42/charge?amount=100   # NOT ALLOWED
POST /orders/42/charges            # correct
```

Proxies and CDNs **cache GET**. A repeat from a link in a log must not charge money.

---

## Content negotiation (in brief)

| Header | Why |
|-----------|-------|
| `Accept: application/json` | response format |
| `Content-Type: application/json` | request body format |
| `Accept-Language` | message localization (rare in machine-to-machine) |
| `If-None-Match` / `ETag` | conditional GET, saving bandwidth |

Versioning via `Accept` — [07-versioning-compatibility](07-versioning-compatibility.md).

---

## Idempotency at the HTTP vs application level

HTTP DELETE is idempotent: a second DELETE → 404 or 204 — the **effect** is "the resource is gone".

POST is **not** idempotent without an **Idempotency-Key** — [08-idempotency-retries](08-idempotency-retries.md).

---

## In mock-exams

| Topic | Course |
|------|------|
| Codes and Exception handlers | [fastapi/11](../fastapi/11-errors-response-model.md) |
| POST + 201 + Location | [fastapi/06](../fastapi/06-lab-crud.md) |
| nginx and upstream errors | [nginx-basic/06–07](../nginx-basic/06-logs-502.md) |

---

## Summary

The method and status code are part of the **public contract**. Safe/idempotent determine **whether you can retry**. Don't hide errors inside `200`.

---

## Checklist

- [ ] Are all GETs free of side effects?
- [ ] Is the creating POST protected by idempotency?
- [ ] Are 401 vs 403 distinguished in the docs?

**Next:** [03. Resource and URL modeling](03-resource-modeling.md).
