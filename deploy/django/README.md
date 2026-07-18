# Django стенд для курса django

Стек: **Django 5 + DRF** → **PostgreSQL 16** + **Redis 7**. Порт **8092**.

Курс: [django](../../courses/django/README.md).

## Запуск

```bash
cd deploy/django
docker compose up -d --build
```

| URL | Назначение |
|-----|------------|
| [http://localhost:8092/health/](http://localhost:8092/health/) | Healthcheck |
| [http://localhost:8092/admin/](http://localhost:8092/admin/) | Django Admin |
| [http://localhost:8092/api/v1/products/](http://localhost:8092/api/v1/products/) | DRF products API |
| [http://localhost:8092/api/v1/categories/](http://localhost:8092/api/v1/categories/) | DRF categories |

Создать superuser (первый раз):

```bash
docker exec -it mock-django-web python manage.py createsuperuser
docker exec mock-django-web python manage.py migrate
docker exec mock-django-web python manage.py loaddata seed 2>/dev/null || true
```

Smoke: `bash scripts/smoke.sh`

## Сброс

```bash
docker compose down -v --rmi local
```

## Связь

| Стенд | Когда |
|-------|-------|
| [`deploy/fastapi`](../fastapi/README.md) | сравнение API-подходов |
| [`deploy/postgres`](../postgres/README.md) | прямой psql |
| [`deploy/nginx`](../nginx/README.md) | TLS lab (урок 40) |
