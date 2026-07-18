# 02. Первый проект: manage.py, apps, runserver

## Введение: «django-admin startproject — и 30 файлов»

Junior запустил `startproject` и спрашивает: «где main?» В Django **нет одного main.py** — есть **`manage.py`**, **`settings`**, **`urls`**, **apps**. Понимание структуры экономит недели навигации.

## Что вы узнаете

- Дерево проекта **`config` + apps**.
- Команды **`migrate`**, **`runserver`**, **`createsuperuser`**.
- **`INSTALLED_APPS`** и регистрация приложений.
- Эталон [`deploy/django/stack/web`](../../deploy/django/stack/web).

---

## Структура эталонного проекта

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

| Файл | Роль |
|------|------|
| `manage.py` | CLI entry |
| `config/settings.py` | конфигурация |
| `config/urls.py` | root URL routing |
| `catalog/` | bounded context «товары» |
| `api/` | HTTP JSON API |

**Паттерн:** domain apps + отдельный api app (не обязательно, но чище для DRF).

---

## manage.py команды

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

В Docker:

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

Порядок важен для **template discovery**, **static**, некоторых **checks**. Свои apps — **после** contrib.

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

`include()` — делегирование в app urls.

---

## runserver vs gunicorn

| | runserver | gunicorn |
|---|-----------|----------|
| Назначение | **dev only** | production |
| Reload | auto | нет |
| Security | не для internet | да |

Стенд compose использует **gunicorn** — как prod.

---

## DEBUG и SECRET_KEY

```python
DEBUG = os.environ.get("DJANGO_DEBUG", "1") == "1"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-insecure")
```

**Никогда** `DEBUG=True` в production. [`04-settings-environments`](04-settings-environments.md).

---

## Проверка на стенде

```bash
cd deploy/django && docker compose up -d --build
curl -s http://localhost:8092/health/
curl -s http://localhost:8092/api/v1/products/ | head -c 200
```

---

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| Забыли migrate | table does not exist |
| App не в INSTALLED_APPS | models not loaded |
| runserver в prod | CVE, perf |
| settings в git с secrets | leak |

## Резюме

Django project = **config** + **apps** + **manage.py**. URLs в корне, logic в apps. migrate перед run. Стенд — gunicorn + postgres.

Далее: [03-lab-explore-stack](03-lab-explore-stack.md).
