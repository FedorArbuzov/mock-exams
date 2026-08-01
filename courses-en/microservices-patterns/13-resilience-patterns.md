# 13. Resilience: timeout, retry, circuit breaker, bulkhead

## Intro

One slow Inventory takes down the whole checkout — a **cascade failure**. Resilience means **explicit** timeouts, retry with jitter, a circuit breaker, and pool isolation (bulkhead).

---

## Timeout (mandatory)

Without a timeout = a thread/goroutine hung forever.

```text
client_timeout ≥ sum(hops) + margin
each hop passes the remaining deadline
```

Related: [05-sync-communication](05-sync-communication.md).

---

## Retry

| Retry | Don't retry |
|-------|----------|
| 503, 502, connection reset | 400, 401, 404, 409 |
| idempotent GET | POST without an idempotency key |

**Exponential backoff + full jitter:**

```text
sleep = random(0, min(cap, base * 2^attempt))
```

Retry limit: 3–5; otherwise a **retry storm** on the recovering service.

---

## Circuit breaker (CB)

```text
Closed → (errors > threshold) → Open → (wait) → Half-Open → probe
```

| State | Behavior |
|-----------|-----------|
| Closed | normal calls |
| Open | fail fast, don't load the sick svc |
| Half-Open | one probe request |

Libraries: resilience4j, tenacity, Polly; in a mesh — outlier detection.

---

## Bulkhead

Isolate resources:

```text
Pool A: checkout → inventory (max 20 threads)
Pool B: admin reports (max 5)
```

A failure in reports doesn't eat the checkout pool.

---

## Fallback vs fail fast

| Strategy | When |
|-----------|-------|
| Fail fast + 503 | critical data (price, stock) |
| Cached fallback | recommendations, avatars |
| Default empty | non-critical blocks |

Don't return a **stale price** from cache without marking it.

---

## Bulkhead + rate limit

Edge rate limit ([api-design/08](../api-design/08-idempotency-retries.md)) + a per-dependency limit inside the svc.

---

## In mock-exams

| Topic | Course |
|------|------|
| Async timeouts | [python-async/34](../python-async/34-system-design-async.md) |
| Celery retry | [python-celery/15](../python-celery/15-retries-backoff.md) |
| HPA / resources | [kuber-intermediate](../kuber-intermediate/README.md) |

---

## Subtasks

**Time:** ~60–70 min.

### 13.1 Policy table (20 min)

For 4 downstream dependencies: timeout | max retries | retryable codes | CB threshold | fallback |

### 13.2 Cascade scenario (15 min)

Describe a cascade without a CB; the same scenario with CB + bulkhead (2 paragraphs).

### 13.3 Retry storm (10 min)

The service recovered — why is retrying from all clients dangerous? How does jitter help?

### 13.4 Half-open probe (10 min)

Which metrics do you look at before closing the CB?

### 13.5 Code sketch (15 min)

Pseudocode for `call_with_resilience(dependency_config)` — language-agnostic.

---

## Summary

Resilience is **per-dependency policies**, not a global "retry=3." Fail fast, isolate pools, don't retry non-idempotent POSTs.

---

## Checklist

- [ ] Does every client have a timeout?
- [ ] POST retry only with idempotency?
- [ ] Bulkhead for heavy paths?

**Next:** [14. Observability in a distributed system](14-distributed-observability.md).
