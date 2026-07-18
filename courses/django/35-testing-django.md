# 35. Тестирование Django: TestCase, Client, APITestCase

## Введение

После deploy миграция добавила NOT NULL поле без default — **500 на каждый POST**. Django test runner + DRF `APITestCase` ловят regression **до** merge.

Базовые паттерны pytest — в [`python-testing`](../python-testing/README.md). Здесь — **встроенный** `manage.py test` и DRF client.

---

## TestCase и транзакции

Каждый test method оборачивается в транзакцию и **откатывается** после завершения — изоляция без ручного truncate.

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

| Класс | Когда |
|-------|-------|
| `TestCase` | 99% unit/integration с ORM |
| `TransactionTestCase` | tests threading, `on_commit` |
| `SimpleTestCase` | без DB |

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

`Client` эмулирует HTTP без сети — middleware stack реальный.

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

`self.client` — DRF APIClient: `.data` уже parsed JSON.

---

## force_authenticate

```python
from django.contrib.auth.models import User

user = User.objects.create_user("apiuser", password="secret")
self.client.force_authenticate(user=user)
r = self.client.post("/api/v1/products/", {...}, format="json")
```

Без реального JWT flow — быстрые permission tests. JWT e2e — отдельный test class.

---

## assert helpers

```python
self.assertEqual(r.status_code, 400)
self.assertIn("price", r.data)  # validation errors
self.assertEqual(Product.objects.count(), 1)
```

DRF: `r.data` dict/list; Django Client: `r.json()` если JsonResponse.

---

## Запуск

```bash
# все apps
python manage.py test

# конкретный модуль
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

## Settings для tests

Django создаёт test DB (`test_course` postgres). Override:

```python
from django.test import override_settings

@override_settings(DEBUG=True)
def test_debug_on(self):
    ...
```

Cache → LocMem в tests — [36-lab-testing](36-lab-testing.md).

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| Tests share redis state | LocMemCache override |
| `IntegrityError` in setUp | unique sku/slug per test |
| 301 redirect in test | follow=True or correct url |
| Migrations not applied | test runner migrates auto — check custom routers |

---

## Резюме

`TestCase` — transactional DB isolation. `Client` — Django views. `APITestCase` — DRF JSON API. `force_authenticate` — auth без login form.

Далее: [36-lab-testing](36-lab-testing.md).
