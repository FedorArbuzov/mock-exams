# 03. Лаба: исследование стенда deploy/django

## Цель лабы

Поднять стенд **8092**, изучить **Admin**, **DRF browsable API**, **manage.py** в контейнере, создать superuser.

## Предварительно

```bash
cd deploy/django
docker compose up -d --build
bash scripts/smoke.sh
```

Теория: [02-first-project](02-first-project.md).

---

## Задание 1. Health и API

```bash
curl -s http://localhost:8092/health/
curl -s http://localhost:8092/api/v1/products/
curl -s http://localhost:8092/api/v1/categories/
```

**Что увидите:** JSON с `"results": []` (пустой каталог до seed).

---

## Задание 2. Superuser и Admin

```bash
docker exec -it mock-django-web python manage.py createsuperuser
```

Откройте [http://localhost:8092/admin/](http://localhost:8092/admin/) — login.

**Что увидите:** Models **Category**, **Product** (после [15-django-admin](15-django-admin.md) глубже).

---

## Задание 3. Создайте Category и Product в Admin

1. Category: name `Books`, slug `books`.
2. Product: sku `BOOK-001`, title `Django for DevOps`, price `49.99`, category Books.

Проверьте API:

```bash
curl -s http://localhost:8092/api/v1/products/ | python -m json.tool
```

---

## Задание 4. Browsable API

Откройте в браузере [http://localhost:8092/api/v1/products/](http://localhost:8092/api/v1/products/) — DRF HTML interface.

POST через форму или curl:

```bash
curl -s -X POST http://localhost:8092/api/v1/products/ \
  -H "Content-Type: application/json" \
  -d '{"sku":"BOOK-002","title":"ORM Deep Dive","price":"39.50","category":1,"is_active":true}'
```

(замените `category` id)

---

## Задание 5. manage.py shell

```bash
docker exec -it mock-django-web python manage.py shell
```

```python
from catalog.models import Product
Product.objects.count()
Product.objects.filter(is_active=True).values_list("sku", flat=True)
```

---

## Если не работает

| Симптом | Действие |
|---------|----------|
| 8092 refused | `docker compose ps`, logs web |
| migrate errors | `docker exec mock-django-web python manage.py migrate` |
| POST 400 | проверьте category id, required fields |

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | smoke.sh ok |
| 2 | Admin login works |
| 3 | ≥1 product в API |
| 4 | shell ORM query ok |

## Вопросы для самопроверки

1. Где root URLconf?
2. Какой app owns Product model?

Далее: [04-settings-environments](04-settings-environments.md).
