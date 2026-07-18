# 38. Docker, Gunicorn, collectstatic, health

## Введение

`runserver` — **однопоточный dev server** с auto-reload. Production: **Gunicorn** (WSGI master + workers) за reverse proxy.

Стенд курса: [`deploy/django`](../../deploy/django/README.md) — порт **8092**.

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
| workers | процессы (CPU × 2 + 1 — orientir) |
| timeout | kill worker если view завис |
| bind | listen address |

**DB pool:** каждый worker держит connections → `workers × pool_size ≤ postgres max_connections`.

Сравнение с ASGI: [`fastapi/33-docker-production`](../fastapi/33-docker-production.md).

---

## entrypoint migrate

```bash
#!/bin/sh
set -e
python manage.py migrate --noinput
exec "$@"
```

Плюс: fresh deploy применяет migrations. Минус: race при **нескольких** replicas — используйте Kubernetes Job или migrate lock.

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

WhiteNoise в `MIDDLEWARE` после Security — отдаёт hashed filenames из manifest.

| Подход | Когда |
|--------|-------|
| WhiteNoise | compose, PaaS, малый трафик |
| nginx alias | высокий static RPS |
| S3 + CDN | cloud scale |

---

## Environment variables

```python
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-insecure")
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost").split(",")
```

**Prod checklist:** `DEBUG=0`, strong `SECRET_KEY`, `ALLOWED_HOSTS` explicit.

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

Readiness может проверять DB:

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

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| runserver в prod | perf, security |
| DEBUG=True leak | stack traces, SECRET exposure |
| No collectstatic | admin без CSS |
| Too many workers | OOM, DB connection storm |

---

## Резюме

Gunicorn — production WSGI. migrate on start — dev/single replica pattern. collectstatic + WhiteNoise — static без отдельного nginx. `/health/` — probes.

Далее: [39-lab-docker](39-lab-docker.md).
