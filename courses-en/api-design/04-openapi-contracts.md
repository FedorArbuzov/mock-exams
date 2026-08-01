# 04. OpenAPI: contract-first and code-first

## Intro

A partner integrates from a PDF in Confluence, while you've already changed a field's type in the code. **OpenAPI** (formerly Swagger) is a machine-readable contract: documentation, mocks, SDKs, and contract tests from a single source.

---

## Contract-first vs code-first

| Approach | Order | Pros | Cons |
|--------|---------|-------|--------|
| **Contract-first** | YAML/JSON OpenAPI → codegen server/client | agreement before code | discipline, duplication with a manual implementation |
| **Code-first** | code (FastAPI, DRF) → OpenAPI | speed, less drift | the contract "trails the code", harder to review |

**FastAPI** is code-first with auto-generation: `/docs`, `/openapi.json`.

**Compromise:** code-first + **PR review of the OpenAPI diff** in CI ([fastapi/32](../fastapi/32-contract-tests.md)).

---

## OpenAPI 3.x structure

```yaml
openapi: 3.1.0
info:
  title: Orders API
  version: 1.2.0
paths:
  /orders:
    post:
      operationId: createOrder
      requestBody: ...
      responses:
        '201': ...
components:
  schemas:
    Order:
      type: object
      required: [id, status]
      properties:
        id: { type: string, format: uuid }
        status: { $ref: '#/components/schemas/OrderStatus' }
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
```

| Section | Why |
|--------|-------|
| `paths` | endpoints, parameters, responses |
| `components/schemas` | reusable models |
| `components/responses` | standard errors |
| `securitySchemes` | OAuth2, API key, bearer |

---

## operationId and tags

- **operationId** — a stable name for codegen (`createOrder`, not `create_order_orders_post`)
- **tags** — grouping in the UI: `Orders`, `Admin`

---

## Examples and descriptions

```yaml
status:
  type: string
  enum: [pending, paid, shipped, cancelled]
  description: Lifecycle state; see state machine in docs.
  example: pending
```

Examples show up in Swagger UI — they cut down on Slack questions.

---

## Request vs response schemas

| Model | Contents |
|--------|------------|
| `OrderCreate` | fields for POST (without `id`, `created_at`) |
| `OrderUpdate` | optional fields for PATCH |
| `Order` | the full GET response |
| `OrderSummary` | a list without heavy nested data |

Duplicating schemas is normal; do **not** return internal fields (`password_hash`, `internal_notes`) through "one big model".

Related: [fastapi/04 Pydantic](../fastapi/04-pydantic-v2.md).

---

## Nullable and required

OpenAPI 3.1 is aligned with JSON Schema:

```yaml
email:
  type: [string, "null"]   # nullable
required: [id, status]     # a missing key = a validation error
```

Document explicitly: "the field is absent" vs "the field is null".

---

## Reusable errors

```yaml
components:
  responses:
    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Problem'
```

See [06-errors-problem-details](06-errors-problem-details.md).

---

## Versioning the spec

| Field | Meaning |
|------|-------|
| `info.version` | the **document** version (1.2.0) |
| URL `/api/v1` | the **runtime** API version |

Don't confuse them: bump `info.version` on every compatible fix; a **v2 URL** — only on a breaking change.

---

## In mock-exams

| Topic | Course |
|------|------|
| Auto-OpenAPI | [fastapi/02](../fastapi/02-first-app.md) |
| Contract tests | [fastapi/32](../fastapi/32-contract-tests.md) |
| DRF + OpenAPI | [django/41](../django/41-interview-qa.md), [django/42](../django/42-capstone.md) |
| Swagger UI | `http://localhost:8090/docs` — [deploy/fastapi](../../deploy/fastapi/README.md) |

---

## Summary

OpenAPI is the **source of truth** for external clients. Code-first is fine if there's a diff in CI and separate Create/Out schemas. Without a machine contract, integrations degrade into email threads.

---

## Checklist

- [ ] Do you have `components/schemas` without duplication across 10 paths?
- [ ] Are operationIds unique?
- [ ] Are errors extracted into reusable responses?

**Next:** [05. Lists: pagination, filters, sorting](05-pagination-filtering.md).
