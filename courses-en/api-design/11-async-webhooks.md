# 11. Asynchronous APIs: webhooks, polling, long-running

## Intro

`POST /reports/generate` takes 40 minutes. Holding an HTTP connection open is bad for the LB and mobile. Long operations are **a different contract**: 202, a job id, a webhook or a poll.

---

## Sync vs async

| Duration | Pattern |
|--------------|---------|
| < 2–5 s | sync 200/201 |
| 5–30 s | sync + an increased timeout **or** 202 (with care) |
| > 30 s | **202 Accepted** + a status resource |

```http
POST /imports
→ 202 Accepted
   Location: /jobs/job_abc123
   { "id": "job_abc123", "status": "pending" }

GET /jobs/job_abc123
→ 200 { "status": "running", "progress": 45 }

GET /jobs/job_abc123
→ 200 { "status": "completed", "result_url": "/imports/imp_99" }
```

---

## The job model

| Field | Type |
|------|-----|
| `id` | opaque string |
| `status` | `pending` \| `running` \| `completed` \| `failed` |
| `created_at` | ISO 8601 |
| `completed_at` | nullable |
| `error` | a Problem object when failed |
| `progress` | 0–100 optional |

Don't return a 500 if the job failed — return **200** with `status: failed` and details.

---

## Webhooks (push)

```text
1. Client registers POST https://partner.com/hooks
2. API finishes the job
3. API POSTs the event to the URL with an HMAC signature
4. Partner 2xx → delivered; otherwise retry with backoff
```

| Practice | Why |
|----------|-------|
| `event_id` unique | dedup on the receiver |
| `timestamp` | replay protection |
| Retry 3–7 times | transient failures |
| Dead letter after N | ops alert |

Queue implementation: [python-celery](../python-celery/README.md), [messaging-deep](../messaging-deep/README.md).

---

## Polling (pull)

```http
GET /jobs/job_abc123
If-None-Match: "v3"
→ 304 Not Modified   # while the status hasn't changed
```

Document the **recommended interval** (exponential: 1s, 2s, 5s, 10s… cap 60s).

---

## SSE and WebSockets

| | SSE | WebSocket |
|--|-----|-----------|
| Direction | server → client | bidirectional |
| HTTP compatibility | yes | upgrade |
| Use case | job status, live feed | chat, gaming |

[fastapi/25](../fastapi/25-websockets-sse.md) — not a replacement for partner webhooks (they need a plain HTTPS POST).

---

## Callback URL (careful with SSRF)

If the client passes a `callback_url`:

- whitelist the `https` scheme only
- block private IP ranges (10/8, 169.254, metadata)
- async fetch via an isolated worker

OWASP API7 — [10-security-public-api](10-security-public-api.md).

---

## Event idempotency

The `order.paid` webhook may arrive twice. The receiver:

```text
if seen(event_id): return 200
process(); store event_id
```

---

## In mock-exams

| Topic | Course |
|------|------|
| Background tasks | [fastapi/24](../fastapi/24-lifespan-background.md) |
| Celery pipeline | [python-celery/19–20](../python-celery/19-workflows-canvas.md) |
| SQS async | [aws-intermediate/07](../aws-intermediate/07-sqs-dlq.md) |
| EventBridge | [aws-intermediate/09](../aws-intermediate/09-eventbridge.md) |

---

## Summary

Long work is a **job resource**, not a hanging POST. A webhook for push, a poll for client simplicity; both with dedup and a signature.

---

## Checklist

- [ ] Is the seconds threshold for a 202 documented?
- [ ] Webhook retry and a DLQ?
- [ ] An event_id for idempotency?

**Next:** [12. Observability and lifecycle APIs](12-observability-lifecycle.md).
