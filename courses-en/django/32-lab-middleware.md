# 32. Lab: RequestTimingMiddleware

## Scenario

SRE sees latency spikes in Grafana but **can't correlate** them with path and response time. We'll add middleware that logs the duration and sets an **`X-Request-Time-Ms`** header — useful both for the nginx access log and for smoke tests.

**Prerequisites:** [31-middleware](31-middleware.md), the `deploy/django` stand on port **8092**.

---

## Goal

1. Create `config/middleware.py` with `RequestTimingMiddleware`.
2. Register it in `MIDDLEWARE` after `SecurityMiddleware`.
3. Confirm: `GET /health/` returns the header; gunicorn logs contain a `path=/health/` line.

---

## Step 1. Middleware file

```python
# config/middleware.py
import logging
import time

logger = logging.getLogger(__name__)


class RequestTimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "request_timing path=%s method=%s status=%s ms=%.2f",
            request.path,
            request.method,
            response.status_code,
            elapsed_ms,
        )
        response["X-Request-Time-Ms"] = f"{elapsed_ms:.2f}"
        return response
```

---

## Step 2. settings.py

```python
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "config.middleware.RequestTimingMiddleware",  # ← after Security
    "whitenoise.middleware.WhiteNoiseMiddleware",
    ...
]
```

**Why after Security:** SecurityMiddleware can short-circuit the request (HTTPS redirect) — timing is still useful for the "full" path down to the view.

---

## Step 3. Rebuild and verify

```bash
cd deploy/django
docker compose up -d --build
curl -sI http://localhost:8092/health/ | grep -i x-request-time
docker compose logs web --tail=30 | grep request_timing
```

Expected header:

```http
X-Request-Time-Ms: 1.23
```

---

## Step 4. Extension (optional)

- Skip `/static/` and `/admin/jsi18n/` — don't clutter the log.
- Add `X-Request-Id` from `uuid.uuid4()` — ties in with [`nginx-basic`](../nginx-basic/README.md)'s `$request_id`.

```python
if request.path.startswith("/static/"):
    return self.get_response(request)
```

---

## Common issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| No header | middleware missing from list / path typo | `manage.py check`, rebuild |
| No logs | LOGGING level is WARNING | add a handler for `config.middleware` |
| Duplicate header | middleware listed twice in MIDDLEWARE | remove the duplicate |

---

## Acceptance criteria

- [ ] `curl -sI http://localhost:8092/health/` includes `X-Request-Time-Ms`
- [ ] `docker compose logs web` contains `request_timing path=/health/`
- [ ] `GET /api/v1/products/` also gets the header (middleware is global)

---

## What you learned

Middleware gives you **one place** for cross-cutting concerns instead of duplicating them in every view/ViewSet. DRF views go through the same stack.

Next: [33-caching-redis](33-caching-redis.md).
