# 35. Testing Django: TestCase, Client, APITestCase

## Overview

After a deploy, a migration added a NOT NULL field without a default — **500 on every POST**. The Django test runner plus DRF's `APITestCase` catch that regression **before** merge.

Basic pytest patterns live in [`python-testing`](../python-testing/README.md). Here we cover the **built-in** `manage.py test` and the DRF client.

---

## TestCase and transactions

Each test method runs inside a transaction that gets **rolled back** afterward — isolation without manual truncation.

```python
from django.test import TestCase
from catalog.models import Product, Category

class ProductModelTest(TestCase):
    def setUp(self):
        self.cat = Category.objects.create(name="Tools", slug="tools")

    def test_str_contains_sku(self):
        p = Product.objects.create(
            sku="HAM-1", title="Hammer", price="12.50", category=self.cat
        )
        self.assertIn("HAM-1", str(p))

    def test_default_is_active(self):
        p = Product.objects.create(sku="X", title="Y", price="1", category=self.cat)
        self.assertTrue(p.is_active)
```

| Class | When |
|-------|-------|
| `TestCase` | 99% of unit/integration tests with the ORM |
| `TransactionTestCase` | threading tests, `on_commit` |
| `SimpleTestCase` | no DB |

---

## Django Client (HTML/JSON views)

```python
from django.test import Client, TestCase

class HealthTest(TestCase):
    def test_health_ok(self):
        r = Client().get("/health/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["status"], "ok")
```

`Client` emulates HTTP without touching the network — the real middleware stack still runs.

---

## APITestCase

```python
from rest_framework.test import APITestCase

class ProductAPITest(APITestCase):
    def setUp(self):
        from catalog.models import Category
        self.cat = Category.objects.create(name="Books", slug="books")

    def test_list_empty_db(self):
        r = self.client.get("/api/v1/products/")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["count"], 0)

    def test_create_product(self):
        r = self.client.post("/api/v1/products/", {
            "sku": "N1",
            "title": "New",
            "price": "10.00",
            "category_id": self.cat.id,
        }, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(r.data["sku"], "N1")
```

`self.client` is the DRF APIClient: `.data` is already parsed JSON.

---

## force_authenticate

```python
from django.contrib.auth.models import User

user = User.objects.create_user("apiuser", password="secret")
self.client.force_authenticate(user=user)
r = self.client.post("/api/v1/products/", {...}, format="json")
```

No real JWT flow needed — quick permission tests. A JWT e2e flow gets its own test class.

---

## assert helpers

```python
self.assertEqual(r.status_code, 400)
self.assertIn("price", r.data)  # validation errors
self.assertEqual(Product.objects.count(), 1)
```

DRF: `r.data` is a dict/list; Django Client: use `r.json()` if it's a JsonResponse.

---

## Running tests

```bash
# all apps
python manage.py test

# a specific module
python manage.py test api.tests.test_products

# verbose
python manage.py test api -v 2

# Docker
docker exec mock-django-web python manage.py test api catalog
```

Parallel (Django 5):

```bash
python manage.py test --parallel auto
```

---

## Settings for tests

Django creates a test DB (`test_course` on postgres). Override with:

```python
from django.test import override_settings

@override_settings(DEBUG=True)
def test_debug_on(self):
    ...
```

Cache switches to LocMem in tests — see [36-lab-testing](36-lab-testing.md).

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Tests share redis state | override with LocMemCache |
| `IntegrityError` in setUp | unique sku/slug per test |
| 301 redirect in test | follow=True or fix the URL |
| Migrations not applied | test runner migrates automatically — check custom routers |

---

## Summary

`TestCase` gives transactional DB isolation. `Client` drives Django views. `APITestCase` drives the DRF JSON API. `force_authenticate` handles auth without a login form.

Next: [36-lab-testing](36-lab-testing.md).
