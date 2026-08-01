# 08. Idempotency, retries, and rate limiting

## Intro

A client sent `POST /payments` — timeout. Retried it. Two charges. The network **will** drop packets; an API must survive **at-least-once delivery** at its boundary.

---

## Where idempotency is needed

| Operation | HTTP idempotent? | Needs an Idempotency-Key? |
|----------|------------------|------------------------|
| GET /orders/42 | yes | no |
| PUT /orders/42 (full replacement) | yes | advisable for create-by-put |
| PATCH status | often | for money — yes |
| POST /orders | **no** | **yes** |
| POST /payments | **no** | **yes** |

---

## Idempotency-Key (Stripe-style)

```http
POST /orders
Idempotency-Key: 7c9e6679-7425-40de-944b-e07fc1f90ae7
Content-Type: application/json

{ "items": [...], "customer_id": "cus_1" }
```

| Response | Meaning |
|-------|-------|
| 201 + body | first success, saved key → response |
| 200/201 + **the same** body | a retry with the same key and the same body |
| 409 | the same key, a **different** body |
| 422 | the first request is still processing (optional) |

Storage TTL: **24–72 h** typically.

---

## Key storage

```text
Redis:  SET idem:{key} → serialized response, EX 86400
Postgres: UNIQUE(idempotency_key), status, response_body, request_hash
```

| | Redis | Postgres |
|--|-------|----------|
| Speed | high | lower |
| Audit | weak | strong |
| Crash between write and response | risk | transaction |

Implementation: [fastapi/39](../fastapi/39-versioning-idempotency.md).

---

## Retry-safe clients

A client **should** retry only:

| Status | Retry? |
|--------|--------|
| 408, 429 (with Retry-After) | yes, with backoff |
| 500, 502, 503, 504 | yes, with backoff + idempotency key |
| 400, 401, 403, 404, 409, 422 | **no** (without changing the request) |

**Exponential backoff + jitter:**

```text
delay = min(cap, base * 2^attempt) + random(0, jitter)
```

---

## The exactly-once illusion

End-to-end exactly-once is **expensive**. In practice:

```text
at-least-once transport + idempotent handler + dedup key
```

Related: [messaging-deep/02](../messaging-deep/02-delivery-guarantees.md).

---

## Rate limiting

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1718123456
```

| Algorithm | Behavior |
|----------|-----------|
| Fixed window | simple; a burst at the window boundary |
| Sliding window | smoother |
| Token bucket | allows a brief burst |

Limits: **per API key**, **per IP** (careful with NAT), **per user**.

Practice: [fastapi/28–29](../fastapi/28-redis-cache.md), [redis-basic](../redis-basic/README.md).

---

## In mock-exams

| Topic | Course |
|------|------|
| Idempotency-Key | [fastapi/39](../fastapi/39-versioning-idempotency.md) |
| Redis rate limit | [fastapi/29-lab](../fastapi/29-lab-redis.md) |
| Celery retries | [python-celery/15](../python-celery/15-retries-backoff.md) |

---

## Summary

A POST involving money **without** an Idempotency-Key is an incident waiting to happen. Document the retry policy and 429 for clients.

---

## Checklist

- [ ] Which POSTs require an Idempotency-Key?
- [ ] A TTL and a 409 on a body mismatch?
- [ ] A 429 with Retry-After?

**Next:** [09. API authentication and authorization](09-auth-patterns.md).
