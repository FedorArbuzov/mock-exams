# 03. Lab: exploring the deploy/django stack

## Lab goal

Bring up the **8092** stack, explore **Admin** and the **DRF browsable API**, run **manage.py** inside the container, and create a superuser.

## Prerequisites

```bash
cd deploy/django
docker compose up -d --build
bash scripts/smoke.sh
```

Theory: [02-first-project](02-first-project.md).

---

## Task 1. Health and API

```bash
curl -s http://localhost:8092/health/
curl -s http://localhost:8092/api/v1/products/
curl -s http://localhost:8092/api/v1/categories/
```

**What you'll see:** JSON with `"results": []` (the catalog is empty until seeded).

---

## Task 2. Superuser and Admin

```bash
docker exec -it mock-django-web python manage.py createsuperuser
```

Open [http://localhost:8092/admin/](http://localhost:8092/admin/) and log in.

**What you'll see:** the **Category** and **Product** models (covered in more depth in [15-django-admin](15-django-admin.md)).

---

## Task 3. Create a Category and a Product in Admin

1. Category: name `Books`, slug `books`.
2. Product: sku `BOOK-001`, title `Django for DevOps`, price `49.99`, category Books.

Check the API:

```bash
curl -s http://localhost:8092/api/v1/products/ | python -m json.tool
```

---

## Task 4. Browsable API

Open [http://localhost:8092/api/v1/products/](http://localhost:8092/api/v1/products/) in a browser — the DRF HTML interface.

POST via the form, or with curl:

```bash
curl -s -X POST http://localhost:8092/api/v1/products/ \
  -H "Content-Type: application/json" \
  -d '{"sku":"BOOK-002","title":"ORM Deep Dive","price":"39.50","category":1,"is_active":true}'
```

(replace `category` with the real id)

---

## Task 5. manage.py shell

```bash
docker exec -it mock-django-web python manage.py shell
```

```python
from catalog.models import Product
Product.objects.count()
Product.objects.filter(is_active=True).values_list("sku", flat=True)
```

---

## If something's not working

| Symptom | Action |
|---------|----------|
| 8092 refused | `docker compose ps`, check web logs |
| migrate errors | `docker exec mock-django-web python manage.py migrate` |
| POST 400 | check the category id and required fields |

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | smoke.sh passes |
| 2 | Admin login works |
| 3 | ≥1 product visible via API |
| 4 | shell ORM query works |

## Self-check questions

1. Where is the root URLconf?
2. Which app owns the Product model?

Next: [04-settings-environments](04-settings-environments.md).
