# Interview cheatsheet — Django + DRF

## Quick map

| Topic | Key phrase |
|-------|------------|
| MTV | Model Template View |
| App | bounded context + migrations |
| QuerySet | lazy SQL chain |
| select_related | FK JOIN |
| prefetch_related | M2M batch |
| Migration | makemigrations → migrate |
| Admin | ModelAdmin internal UI |
| Serializer | JSON validation |
| ViewSet | CRUD verbs one class |
| Router | URL registration |
| JWT | Bearer access token |
| Middleware | request/response wrapper |
| cache | django-redis TTL + invalidate |
| TestCase | DB transaction test |
| gunicorn | WSGI workers |

## Commands

```bash
python manage.py migrate
python manage.py makemigrations
python manage.py createsuperuser
python manage.py test
python manage.py shell
gunicorn config.wsgi:application
```

## Stand

| Port | Stack |
|------|-------|
| 8092 | deploy/django |
| 8090 | deploy/fastapi (compare) |

## Django vs FastAPI (one line)

**Django+DRF** = batteries + admin + ORM; **FastAPI** = typed async API-first.

Full answers: [41-interview-qa](41-interview-qa.md).
