# 04. Settings: окружения, 12-factor, безопасность

## Введение: «SECRET_KEY в GitHub — bot farm за ночь»

Intern закоммитил `settings.py` с production `SECRET_KEY` и `DEBUG=True`. Bots нашли `/admin/` через Google. Эта глава — **конфигурация через env**, split settings, checklist prod.

## Что вы узнаете

- **Environment variables** для secrets.
- **`ALLOWED_HOSTS`**, **`CSRF_TRUSTED_ORIGINS`**.
- Split **`settings/base.py` + dev/prod** (pattern).
- Database из **`DATABASE_URL`**.

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
| DJANGO_SECRET_KEY | dev-only | random 50+ chars |
| DJANGO_ALLOWED_HOSTS | localhost | api.example.com |

---

## DATABASE_URL parsing

Эталон [`config/settings.py`](../../deploy/django/stack/web/config/settings.py) парсит:

```text
postgres://course:course@postgres:5432/course
```

Для локальной разработки без Docker:

```bash
export POSTGRES_HOST=localhost
export POSTGRES_PORT=5432
```

См. [`postgresql-basic`](../postgresql-basic/README.md).

---

## ALLOWED_HOSTS и Host header attack

```python
ALLOWED_HOSTS = ["api.shop.local", "localhost"]
```

Без этого Django 400 на неизвестный Host — защита от poisoned cache / password reset links.

За nginx:

```python
USE_X_FORWARDED_HOST = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
```

[`nginx-basic`](../nginx-basic/README.md), [40-nginx-static](40-nginx-static.md).

---

## CSRF и CORS (preview)

- **CSRF** — для session cookie forms.
- **DRF token/JWT** — often `SessionAuthentication` off for API.

CORS — `django-cors-headers` если SPA на другом origin (capstone optional).

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

Structured JSON — [`observability-basic`](../observability-basic/README.md).

---

## Checklist перед prod

- [ ] DEBUG=False
- [ ] SECRET_KEY from vault/env
- [ ] ALLOWED_HOSTS set
- [ ] HTTPS redirect (SECURE_SSL_REDIRECT)
- [ ] Secure cookies (SESSION_COOKIE_SECURE)
- [ ] DB credentials not in repo

[`appsec-fundamentals`](../appsec-fundamentals/README.md).

---

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| DEBUG leak stack traces | info disclosure |
| * in ALLOWED_HOSTS lazy | host header bypass |
| Same SECRET all envs | session forge cross-env |

## Резюме

Settings через **env**. DEBUG off in prod. ALLOWED_HOSTS mandatory. DATABASE_URL for compose. Split settings for teams.

Далее: [05-apps-structure](05-apps-structure.md).
