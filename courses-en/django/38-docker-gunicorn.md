# 38. Docker, Gunicorn, collectstatic, health

## Overview

`runserver` is a **single-threaded dev server** with auto-reload. In production you want **Gunicorn** (WSGI master + workers) behind a reverse proxy.

Course stack: [`deploy/django`](../../deploy/django/README.md) — port **8092**.

---

## Gunicorn model

```text
Master process
 ├── Worker 1  → handles requests (sync WSGI)
 ├── Worker 2
 └── ...
```

```dockerfile
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "60"]
```

| Param | Meaning |
|-------|---------|
| workers | processes (CPU × 2 + 1 as a rough guide) |
| timeout | kills a worker if a view hangs |
| bind | listen address |

**DB pool:** every worker holds its own connections → `workers × pool_size ≤ postgres max_connections`.

Comparison with ASGI: [`fastapi/33-docker-production`](../fastapi/33-docker-production.md).

---

## entrypoint migrate

```bash
#!/bin/sh
set -e
python manage.py migrate --noinput
exec "$@"
```

Upside: a fresh deploy applies migrations automatically. Downside: races when running **multiple** replicas — use a Kubernetes Job or a migrate lock instead.

---

## collectstatic + WhiteNoise

```python
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}
```

```bash
python manage.py collectstatic --noinput
```

Put WhiteNoise in `MIDDLEWARE` right after Security — it serves hashed filenames from the manifest.

| Approach | When |
|--------|-----|
| WhiteNoise | compose, PaaS, low traffic |
| nginx alias | high static RPS |
| S3 + CDN | cloud scale |

---

## Environment variables

```python
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-insecure")
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost").split(",")
```

**Prod checklist:** `DEBUG=0`, a strong `SECRET_KEY`, `ALLOWED_HOSTS` set explicitly.

---

## Health endpoint

```python
def health(_request):
    return JsonResponse({"status": "ok", "framework": "django"})
```

Kubernetes:

```yaml
livenessProbe:
  httpGet:
    path: /health/
    port: 8000
  initialDelaySeconds: 30
readinessProbe:
  httpGet:
    path: /health/
    port: 8000
```

Readiness can check the DB too:

```python
from django.db import connection
connection.ensure_connection()
```

---

## docker-compose topology

```text
nginx (optional) → web:8000 (gunicorn)
                    ├── postgres:5432
                    └── redis:6379
```

[`containers-basic`](../containers-basic/README.md) — networks, volumes.

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| runserver in prod | poor perf, security risk |
| DEBUG=True leak | stack traces, SECRET exposure |
| No collectstatic | admin without CSS |
| Too many workers | OOM, DB connection storm |

---

## Summary

Gunicorn is the production WSGI server. Migrating on start is a dev/single-replica pattern. collectstatic + WhiteNoise serve static files without a separate nginx. `/health/` backs the probes.

Next: [39-lab-docker](39-lab-docker.md).
