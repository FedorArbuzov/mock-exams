# 04. Settings: environments, 12-factor, security

## Intro: "SECRET_KEY on GitHub — bot farm by morning"

An intern committed `settings.py` with the production `SECRET_KEY` and `DEBUG=True`. Bots found `/admin/` through Google within hours. This chapter covers **configuration through env vars**, split settings, and a production checklist.

## What you'll learn

- **Environment variables** for secrets.
- **`ALLOWED_HOSTS`**, **`CSRF_TRUSTED_ORIGINS`**.
- The split **`settings/base.py` + dev/prod** pattern.
- Building the database config from **`DATABASE_URL`**.

---

## 12-factor config

```python
import os
SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]  # required in prod
DEBUG = os.environ.get("DJANGO_DEBUG", "0") == "1"
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")
```

| Variable | Dev | Prod |
|----------|-----|------|
| DJANGO_DEBUG | 1 | **0** |
| DJANGO_SECRET_KEY | dev-only | random, 50+ chars |
| DJANGO_ALLOWED_HOSTS | localhost | api.example.com |

---

## Parsing DATABASE_URL

The reference [`config/settings.py`](../../deploy/django/stack/web/config/settings.py) parses:

```text
postgres://course:course@postgres:5432/course
```

For local development without Docker:

```bash
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
```

See [`postgresql-basic`](../postgresql-basic/README.md).

---

## ALLOWED_HOSTS and Host header attacks

```python
ALLOWED_HOSTS = ["api.shop.local", "localhost"]
```

Without this, Django returns 400 on an unknown Host header — this guards against poisoned caches and forged password-reset links.

Behind nginx:

```python
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
```

See [`nginx-basic`](../nginx-basic/README.md), [40-nginx-static](40-nginx-static.md).

---

## CSRF and CORS (preview)

- **CSRF** — for session-cookie-backed forms.
- **DRF token/JWT** — `SessionAuthentication` is often turned off for APIs.

CORS — use `django-cors-headers` if an SPA lives on a different origin (optional in the capstone).

---

## Split settings pattern

```text
config/settings/
  __init__.py      # from .prod import *
  base.py
  dev.py
  prod.py
```

```python
# manage.py / wsgi
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.prod")
```

---

## Logging (prod preview)

```python
LOGGING = {
    "version": 1,
    "handlers": {"console": {"class": "logging.StreamHandler"}},
    "root": {"handlers": ["console"], "level": "INFO"},
}
```

Structured JSON logging — see [`observability-basic`](../observability-basic/README.md).

---

## Pre-production checklist

- [ ] DEBUG=False
- [ ] SECRET_KEY from vault/env
- [ ] ALLOWED_HOSTS set
- [ ] HTTPS redirect (SECURE_SSL_REDIRECT)
- [ ] Secure cookies (SESSION_COOKIE_SECURE)
- [ ] DB credentials not in the repo

[`appsec-fundamentals`](../appsec-fundamentals/README.md).

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| DEBUG leaking stack traces | information disclosure |
| Lazy `*` in ALLOWED_HOSTS | Host header bypass |
| Same SECRET_KEY across all environments | cross-env session forgery |

## Summary

Settings come from **env vars**. DEBUG is off in prod. ALLOWED_HOSTS is mandatory. DATABASE_URL drives compose. Split settings help teams scale.

Next: [05-apps-structure](05-apps-structure.md).
