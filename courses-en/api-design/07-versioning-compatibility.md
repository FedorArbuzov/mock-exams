# 07. Versioning and backward compatibility

## Intro

"We just added a field" — and the mobile client crashed, because its parser can't tolerate unknown keys. An API version is a **promise**; a breaking change without a v2 is technical debt with interest.

---

## Versioning strategies

| Strategy | Example | When |
|-----------|--------|-------|
| URL path | `/api/v1/orders` | the default for public APIs |
| Header | `Api-Version: 2024-06-01` | Stripe-style date versions |
| Accept | `application/vnd.acme.v2+json` | strict REST |
| No version | compatible changes only | internal services behind a mesh |

Detailed implementation: [fastapi/39](../fastapi/39-versioning-idempotency.md).

---

## Compatible vs breaking

| Change | Compatible? |
|-----------|-------------|
| Add an **optional** field to a response | yes |
| Add an optional query param | yes |
| Add a new endpoint | yes |
| Remove a field from a response | **breaking** |
| Rename a field | **breaking** |
| Change a type (`string` → `number`) | **breaking** |
| Make an optional field required in a request | **breaking** |
| Change the semantics of a 200 | **breaking** |

**Rule for clients:** ignore unknown fields (Postel's law). **Rule for the server:** don't break old clients without a new version.

---

## Parallel run of v1 and v2

```text
Phase 1: v1 frozen (bugfix only), v2 new features
Phase 2: v1 deprecated (headers + docs)
Phase 3: v1 sunset (metrics < 1% RPS)
Phase 4: v1 off
```

| Header | Value |
|-----------|----------|
| `Deprecation` | `true` |
| `Sunset` | `Sat, 01 Jan 2028 00:00:00 GMT` |
| `Link` | `<.../migration>; rel="deprecation"` |

---

## OpenAPI diff in CI

On every PR:

- removed fields → fail
- a changed `type` → fail
- a new required field in a request → fail
- an added optional field → pass

Tools: `openapi-diff`, `oasdiff`, [fastapi/32](../fastapi/32-contract-tests.md).

---

## Client migration

A **Migration guide v1 → v2** document:

1. A field mapping table
2. Sunset timelines
3. Before/after request examples
4. A sandbox with v2

---

## DB version ≠ API version

A Postgres schema migration can be **internal**; the API stays v1 through a mapping layer. Don't expose "we moved to the orders_v2 table".

---

## Feature flags vs versioning

| | API version | Feature flag |
|--|-------------|--------------|
| Contract | fixed in the spec | can change daily |
| Audience | all v2 clients | a subset of users |
| Documentation | OpenAPI v2 | internal |

Flags are for **behavior** within a version; not a replacement for a breaking path change.

---

## In mock-exams

| Topic | Course |
|------|------|
| `/api/v1` routers | [fastapi/39](../fastapi/39-versioning-idempotency.md) |
| Contract diff | [fastapi/32](../fastapi/32-contract-tests.md) |
| Capstone v2 | [fastapi/42](../fastapi/42-capstone.md) |

---

## Summary

A version is a **boundary of promises**. Extend compatibly within v1; breaking changes go only into v2 with sunset and usage metrics.

---

## Checklist

- [ ] Is there a policy for compatible changes?
- [ ] Sunset headers on deprecated paths?
- [ ] OpenAPI diff in CI?

**Next:** [08. Idempotency, retries, and rate limiting](08-idempotency-retries.md).
