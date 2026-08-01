# API Design

A theory course on **"how to design HTTP APIs"**: REST semantics, resource modeling, **OpenAPI**, errors, versioning, idempotency, auth, webhooks, and service boundaries. A "book"-style format in English, **with no new sandbox** — hands-on practice lives in [fastapi](../fastapi/README.md), [django](../django/README.md), and `deploy/*`.

**Who it's for:** backend developers, tech leads, platform engineers; anyone designing a **public or internal API** and preparing for **system design** / interviews.

**Prerequisites (at least one, ideally two):**

| Course | Why |
|------|--------|
| [fastapi/02](../fastapi/02-first-app.md) | OpenAPI out of the box, your first endpoint |
| [nginx-basic](../nginx-basic/README.md) | HTTP, reverse proxy, TLS |
| [postgresql-basic/03](../postgresql-basic/03-databases-schemas.md) | entities and relationships in data |

**Useful:** [fastapi/39](../fastapi/39-versioning-idempotency.md), [fastapi/32](../fastapi/32-contract-tests.md), [messaging-deep](../messaging-deep/README.md) (async/events), [microservices-patterns](../microservices-patterns/README.md) (boundaries and saga), [appsec-fundamentals](../appsec-fundamentals/README.md).

## How to read

- Chapters **01–12** — ~**35–50 min** each.
- The **"In mock-exams"** block — where to go for hands-on.
- [Final](14-synthesis.md) — an **API Design Record (ADR)** for a single product (**2–3 h**).

**Time:** ~**12–16 hours**.

## Curriculum

### Part I — Fundamentals (01–03)

| # | Chapter |
|---|--------|
| 01 | [API styles: REST, RPC, GraphQL, gRPC, events](01-landscape-styles.md) |
| 02 | [HTTP: methods, status codes, safe and idempotent](02-http-semantics.md) |
| 03 | [Resource and URL modeling](03-resource-modeling.md) |

### Part II — The contract (04–07)

| # | Chapter |
|---|--------|
| 04 | [OpenAPI: contract-first and code-first](04-openapi-contracts.md) |
| 05 | [Lists: pagination, filters, sorting](05-pagination-filtering.md) |
| 06 | [Errors and Problem Details (RFC 7807)](06-errors-problem-details.md) |
| 07 | [Versioning and backward compatibility](07-versioning-compatibility.md) |

### Part III — Reliability and security (08–10)

| # | Chapter |
|---|--------|
| 08 | [Idempotency, retries, and rate limiting](08-idempotency-retries.md) |
| 09 | [API authentication and authorization](09-auth-patterns.md) |
| 10 | [Public API security](10-security-public-api.md) |

### Part IV — Lifecycle (11–14)

| # | Chapter |
|---|--------|
| 11 | [Asynchronous APIs: webhooks, polling, long-running](11-async-webhooks.md) |
| 12 | [Observability and lifecycle APIs](12-observability-lifecycle.md) |
| 13 | [Service boundaries and system design](13-boundaries-system-design.md) |
| 14 | [Synthesis: API Design Record](14-synthesis.md) |

## Sandboxes (optional)

| Practice | Where |
|----------|-----|
| FastAPI + OpenAPI | [`deploy/fastapi`](../../deploy/fastapi/README.md) — [fastapi](../fastapi/README.md) |
| Django REST Framework | [`deploy/django`](../../deploy/django/README.md) — [django](../django/README.md) |
| Contract tests | [fastapi/32](../fastapi/32-contract-tests.md), [python-testing](../python-testing/README.md) |
| nginx / TLS | [`deploy/nginx`](../../deploy/nginx/README.md) |

## What you should end up with

- You pick an API style (**REST vs RPC vs events**) based on the problem, not the trend.
- You design **resources, URLs, and response codes** without "POST /getUserById".
- You describe the contract in **OpenAPI** and tell breaking from compatible changes.
- You build in an **Idempotency-Key**, a single error format, and a **deprecation policy**.
- You write an **ADR** for "Orders API v1" with alternatives and a security checklist.

## Related to fastapi

[fastapi](../fastapi/README.md) is the **implementation** in Python. **API Design** covers the **principles**, applicable to FastAPI, DRF, Go, and Node. Overlap: [39-versioning-idempotency](../fastapi/39-versioning-idempotency.md), [32-contract-tests](../fastapi/32-contract-tests.md), [22-security-checklist](../fastapi/22-security-checklist.md). Next: [microservices-patterns](../microservices-patterns/README.md) — saga, outbox, migrating away from a monolith.
