# 02. Your first project: manage.py, apps, runserver

## Intro: "django-admin startproject — and suddenly 30 files"

A junior dev runs `startproject` and asks, "where's main?" Django doesn't have a single main.py — it has **`manage.py`**, **`settings`**, **`urls`**, and **apps**. Understanding this layout saves weeks of navigation headaches.

## What you'll learn

- The **`config` + apps** project tree.
- The **`migrate`**, **`runserver`**, **`createsuperuser`** commands.
- **`INSTALLED_APPS`** and app registration.
- The course reference at [`deploy/django/stack/web`](../../deploy/django/stack/web).

---

## Reference project layout

```text
stack/web/
  manage.py
  config/
    settings.py
    urls.py
    wsgi.py
  catalog/          # domain models + admin
    models.py
    admin.py
    migrations/
  api/              # DRF layer
    serializers.py
    views.py
    urls.py
```

| File | Role |
|------|------|
| `manage.py` | CLI entry point |
| `config/settings.py` | configuration |
| `config/urls.py` | root URL routing |
| `catalog/` | bounded context for "products" |
| `api/` | HTTP JSON API |

**Pattern:** domain apps plus a separate api app (not mandatory, but cleaner for DRF).

---

## manage.py commands

```bash
cd deploy/django/stack/web
python manage.py help
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
python manage.py createsuperuser
python manage.py makemigrations catalog
python manage.py shell
python manage.py check
python manage.py showmigrations
```

In Docker:

```bash
docker exec -it mock-django-web python manage.py migrate
docker exec -it mock-django-web python manage.py createsuperuser
```

---

## INSTALLED_APPS

```python
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    ...
    "rest_framework",
    "catalog",
    "api",
]
```

Order matters for **template discovery**, **static files**, and some **checks**. Your own apps go **after** contrib apps.

---

## ROOT_URLCONF

```python
# config/urls.py
urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health),
    path("api/v1/", include("api.urls")),
]
```

`include()` delegates to an app's own urls module.

---

## runserver vs gunicorn

| | runserver | gunicorn |
|---|-----------|----------|
| Purpose | **dev only** | production |
| Reload | auto | no |
| Security | not internet-facing | yes |

The course's compose stack uses **gunicorn**, matching production.

---

## DEBUG and SECRET_KEY

```python
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-insecure")
```

**Never** run with `DEBUG=True` in production. See [`04-settings-environments`](04-settings-environments.md).

---

## Checking the stack

```bash
cd deploy/django && docker compose up -d --build
curl -s http://localhost:8092/health/
curl -s http://localhost:8092/api/v1/products/ | head -c 200
```

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| Forgot to migrate | table does not exist |
| App missing from INSTALLED_APPS | models not loaded |
| runserver in prod | CVEs, poor performance |
| settings committed with secrets | leak |

## Summary

A Django project is **config** + **apps** + **manage.py**. URLs live at the root, logic lives in apps. Migrate before you run. The course stack uses gunicorn + postgres.

Next: [03-lab-explore-stack](03-lab-explore-stack.md).
