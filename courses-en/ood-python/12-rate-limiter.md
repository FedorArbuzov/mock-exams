# 12. Rate Limiter

## Intro

**Token bucket** or **sliding window** — OOD + concurrency basics. Related: [nginx/04](../nginx/04-rate-limiting.md), [api-design/12](../api-design/12-versioning-errors.md).

---

## Token bucket

- `rate` tokens/sec refill
- `capacity` max burst
- `allow()` consumes 1 token

```python
limiter = TokenBucketLimiter(rate=10, capacity=2)
```

See [examples/ood/rate_limiter.py](examples/ood/rate_limiter.py).

---

## Alternatives

| Algorithm | Upside |
|----------|------|
| Fixed window | simplicity |
| Sliding window | more accurate |
| Token bucket | burst |

---

## OOD

```text
RateLimiter (Protocol)
  ├── TokenBucketLimiter
  └── SlidingWindowLimiter (stub)
```

Middleware in FastAPI wraps `allow()`.

---

## Sub-tasks

**Time:** ~65 min.

### 12.1 Compare algorithms (15 min)

A token vs sliding table — 3 rows.

### 12.2 Implement (35 min)

Token bucket + tests.

### 12.3 Distributed (15 min)

Out loud: Redis + Lua vs local only.

---

## Checklist

- [ ] Refill math correct?
- [ ] Burst respected?

**Next:** [13. Bookstore](13-bookstore.md).
