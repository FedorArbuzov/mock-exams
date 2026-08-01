# 14. Synthesis: API Design Record

## Practice task

Pick a product:

- [image-platform](../aws-intermediate/projects/image-platform/) (upload → process → status), or
- [fastapi/42 capstone](../fastapi/42-capstone.md) (tasks API), or
- your own service.

### Deliverable: an API Design Record (ADR) (2–3 h)

**1. Context**

| Field | Value |
|------|----------|
| Clients | web / mobile / partners / M2M |
| Public or internal | |
| Expected RPS (order of magnitude) | |
| Criticality (money, PII) | |

**2. Style decision**

Justify it: REST / RPC / events / a combination.

| Criterion | REST | Events | Choice |
|----------|------|--------|-------|
| GET caching | | | |
| Notification fan-out | | | |
| Long operations | | | |

**3. Resource map**

```text
/...
  ├── ...
  └── ...
```

A table: resource, methods, id type, auth scope.

**4. Contract snippets**

- An OpenAPI fragment (1 create + 1 list + 1 error response)
- A Problem Details example
- Pagination format (cursor or offset — why)

**5. Cross-cutting**

| Topic | Decision |
|------|---------|
| Versioning | `/api/v1`, sunset policy |
| Idempotency | which POSTs + TTL |
| Rate limit | limits per key |
| Errors | `application/problem+json` |
| Long-running | 202 + job + webhook? |

**6. Security**

- A BOLA test scenario
- A scopes matrix (role × endpoint)
- What does not go into the JSON response

**7. Observability**

- 3 key metrics (RED)
- An SLO draft (availability, p99)
- An `X-Request-Id` policy

**8. Rejected alternatives**

At least two: "why not GraphQL", "why not sync for step X".

---

## Course master table

| Question | Chapter |
|--------|-------|
| REST vs gRPC vs events? | [01](01-landscape-styles.md) |
| Which method and status? | [02](02-http-semantics.md) |
| How to name the URL? | [03](03-resource-modeling.md) |
| Where's OpenAPI? | [04](04-openapi-contracts.md) |
| How to slice lists? | [05](05-pagination-filtering.md) |
| Error format? | [06](06-errors-problem-details.md) |
| When a v2? | [07](07-versioning-compatibility.md) |
| Retrying a POST? | [08](08-idempotency-retries.md) |
| Who can call it? | [09](09-auth-patterns.md) |
| OWASP baseline? | [10](10-security-public-api.md) |
| A long request? | [11](11-async-webhooks.md) |
| Metrics and changelog? | [12](12-observability-lifecycle.md) |
| BFF and boundaries? | [13](13-boundaries-system-design.md) |

---

## Course map

```text
01–03  Styles, HTTP, resources
04–07  OpenAPI, lists, errors, versions
08–10  Idempotency, auth, security
11–14  Async, ops, system design, ADR
```

---

## In mock-exams — practice

| ADR item | Course |
|-----------|------|
| Implement CRUD + OpenAPI | [fastapi](../fastapi/README.md) |
| DRF + serializers | [django](../django/README.md) |
| Contract tests | [fastapi/32](../fastapi/32-contract-tests.md) |
| Idempotency + v2 | [fastapi/39](../fastapi/39-versioning-idempotency.md) |
| Events after create | [messaging-deep](../messaging-deep/README.md) |
| Metrics | [fastapi/36–37](../fastapi/36-observability.md) |

---

## Summary

A good API isn't "pretty JSON" but a **coherent contract** that lasts for years: resources, errors, versions, security, and a way to evolve. An ADR captures the decisions before the first line of code.

---

## Final checklist

- [ ] Is the ADR aligned with the OpenAPI fragment?
- [ ] Are there rejected alternatives?
- [ ] Are idempotency and pagination stated explicitly?
- [ ] Is the security matrix filled in?

**Course complete.** Next: [fastapi/42 capstone](../fastapi/42-capstone.md), [messaging-deep](../messaging-deep/README.md), [appsec-fundamentals](../appsec-fundamentals/README.md).
