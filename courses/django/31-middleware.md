# 31. Middleware и request lifecycle

## Введение

Middleware — **onion** around view. Security, sessions, CSRF — all middleware.

```mermaid
flowchart TB
  R[Request] --> M1[SecurityMiddleware]
  M1 --> M2[SessionMiddleware]
  M2 --> M3[CommonMiddleware]
  M3 --> V[View]
  V --> M3
  M3 --> M2
  M2 --> M1
  M1 --> Resp[Response]
```

Order in `MIDDLEWARE` matters.

---

## Custom middleware

```python
import time
import logging
logger = logging.getLogger(__name__)

class RequestTimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        ms = (time.perf_counter() - start) * 1000
        logger.info("path=%s ms=%.1f status=%s", request.path, ms, response.status_code)
        response["X-Request-Time-Ms"] = f"{ms:.1f}"
        return response
```

Register in settings **after** SecurityMiddleware typically.

---

## process_view / exception

Class-based middleware can implement `process_view`, `process_exception` (legacy style) — prefer `__call__` wrapper.

---

## DRF vs Django middleware

Runs **before** DRF view — auth header available.

---

## Signals preview

Middleware = request/response cross-cutting. **Signals** = model save/post_delete — [33-caching-redis](33-caching-redis.md) neighbor.

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| Heavy work in middleware | cache or async task |
| Wrong order | read Django docs default stack |

## Резюме

Middleware wraps all views. Custom for timing, request ID, security headers. Order critical.

Далее: [32-lab-middleware](32-lab-middleware.md).
