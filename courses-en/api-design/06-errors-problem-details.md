# 06. Errors and Problem Details (RFC 7807)

## Intro

A client got a `400` with a body of `{"error": "bad request"}` — what should they fix? The `email` field? A header? The API version? A **single error format** saves weeks of integration work.

---

## Anti-patterns

```json
{ "success": false, "message": "Error" }
{ "error": true, "data": null }
{ "errors": "invalid" }
```

Problems: no error **type**, no **link to a field**, monitoring can't tell a 400 from a 500 by the body.

---

## RFC 7807 Problem Details

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json

{
  "type": "https://api.example.com/problems/validation-error",
  "title": "Validation failed",
  "status": 422,
  "detail": "One or more fields are invalid.",
  "instance": "/orders/req-abc123",
  "errors": [
    { "field": "items[0].quantity", "code": "min_value", "message": "Must be >= 1" }
  ]
}
```

| Field | Purpose |
|------|------------|
| `type` | a URI identifying the error class (stable) |
| `title` | short, for a human |
| `status` | duplicates the HTTP code (for logs without headers) |
| `detail` | specifics of the incident |
| `instance` | the request URI or a correlation id |
| extension | `errors[]`, `retry_after`, domain codes |

`type` can be `about:blank` for a generic error, but for a public API your **own URIs** are better.

---

## Application error codes

```json
{
  "type": ".../insufficient-stock",
  "code": "INSUFFICIENT_STOCK",
  "detail": "SKU laptop-15: requested 5, available 2"
}
```

| Level | Example |
|---------|--------|
| HTTP status | 409 Conflict |
| `type` / `code` | `ORDER_ALREADY_CANCELLED` |
| `field` | `status` |

SDK clients branch on the **`code`**, not on the `detail` text.

---

## 401 vs 403 vs 404

| Status | Meaning | Body |
|--------|-------|------|
| **401** | no/broken token | `.../unauthorized` |
| **403** | token ok, no permission | `.../forbidden` |
| **404** | resource not found | don't reveal the existence of other tenants' ids |

For multi-tenant: `GET /orders/other-tenant-id` → **404**, not 403 (otherwise enumeration).

---

## 422 vs 400

| | 400 Bad Request | 422 Unprocessable |
|--|-----------------|-------------------|
| Broken JSON syntax | yes | — |
| Field semantics (Pydantic) | debatable | often 422 |
| Business rule "cart is empty" | 400 or 409 | — |

**The key point:** one policy across the whole API and in OpenAPI.

---

## Errors in OpenAPI

```yaml
responses:
  '409':
    description: Conflict
    content:
      application/problem+json:
        schema:
          $ref: '#/components/schemas/Problem'
        example:
          type: https://api.example.com/problems/duplicate-order
          status: 409
          code: DUPLICATE_CLIENT_ORDER_ID
```

---

## Logging vs the client response

| To the log (server) | To the client |
|----------------|---------|
| stack trace, SQL | no |
| correlation id | yes (`instance` / `request_id`) |
| internal shard | no |

The **`X-Request-Id`** or `traceparent` header — [12-observability-lifecycle](12-observability-lifecycle.md).

---

## In mock-exams

| Topic | Course |
|------|------|
| HTTPException, handlers | [fastapi/11–12](../fastapi/11-errors-response-model.md) |
| Validation 422 | [fastapi/04](../fastapi/04-pydantic-v2.md) |
| Security errors | [fastapi/22](../fastapi/22-security-checklist.md) |

---

## Summary

An error is **part of the contract**. Problem Details + stable `code`s + a single status policy. The `detail` text can be localized; client logic keys off `code`.

---

## Checklist

- [ ] Are all 4xx/5xx in a single JSON format?
- [ ] Is there a correlation id in the response?
- [ ] Does OpenAPI describe error responses?

**Next:** [07. Versioning and backward compatibility](07-versioning-compatibility.md).
