# 12. Rate Limiter

## Введение

**Token bucket** или **sliding window** — OOD + concurrency basics. Связь [nginx/04](../nginx/04-rate-limiting.md), [api-design/12](../api-design/12-versioning-errors.md).

---

## Token bucket

- `rate` tokens/sec refill
- `capacity` max burst
- `allow()` consumes 1 token

```python
limiter = TokenBucketLimiter(rate=10, capacity=2)
```

См. [examples/ood/rate_limiter.py](examples/ood/rate_limiter.py).

---

## Альтернативы

| Алгоритм | Плюс |
|----------|------|
| Fixed window | простота |
| Sliding window | точнее |
| Token bucket | burst |

---

## OOD

```text
RateLimiter (Protocol)
  ├── TokenBucketLimiter
  └── SlidingWindowLimiter (stub)
```

Middleware в FastAPI оборачивает `allow()`.

---

## Подзадачи

**Время:** ~65 мин.

### 12.1 Compare algorithms (15 мин)

Таблица token vs sliding — 3 строки.

### 12.2 Implement (35 мин)

Token bucket + tests.

### 12.3 Distributed (15 мин)

Устно: Redis + Lua vs local only.

---

## Чек-лист

- [ ] Refill math correct?
- [ ] Burst respected?

**Дальше:** [13. Bookstore](13-bookstore.md).
