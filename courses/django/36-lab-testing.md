# 36. Лаба: API test suite

## Сценарий

Рефactoring serializers сломал filter — без tests узнаём от prod. Напишем **APITestCase** suite для Product API.

**Предварительно:** [35-testing-django](35-testing-django.md), стенд или локальный `manage.py test`.

---

## Цель

Файл `api/tests/test_products.py` — **≥8 tests**, все green, runtime < 30s.

---

## Шаг 1. Структура

```text
api/tests/
  __init__.py
  test_products.py
```

---

## Шаг 2. Базовый setUp

```python
# api/tests/test_products.py
from django.contrib.auth.models import User
from rest_framework.test import APITestCase
from catalog.models import Category, Product


class ProductAPITestCase(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Books", slug="books")
        self.product = Product.objects.create(
            sku="T-1",
            title="Test Book",
            price="19.99",
            category=self.category,
        )
        self.list_url = "/api/v1/products/"
        self.detail_url = f"/api/v1/products/{self.product.pk}/"
```

---

## Шаг 3. Минимальный набор tests

```python
    def test_list_returns_200_and_count(self):
        r = self.client.get(self.list_url)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["count"], 1)
        self.assertEqual(r.data["results"][0]["sku"], "T-1")

    def test_retrieve_200(self):
        r = self.client.get(self.detail_url)
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["title"], "Test Book")

    def test_retrieve_404(self):
        r = self.client.get("/api/v1/products/99999/")
        self.assertEqual(r.status_code, 404)

    def test_create_valid(self):
        payload = {
            "sku": "NEW-1",
            "title": "New",
            "price": "9.99",
            "category_id": self.category.id,
        }
        r = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertTrue(Product.objects.filter(sku="NEW-1").exists())

    def test_create_invalid_price(self):
        payload = {"sku": "BAD", "title": "Bad", "price": "-1", "category_id": self.category.id}
        r = self.client.post(self.list_url, payload, format="json")
        self.assertEqual(r.status_code, 400)

    def test_filter_min_price(self):
        r = self.client.get(self.list_url, {"min_price": 20})
        self.assertEqual(r.data["count"], 0)

    def test_search(self):
        r = self.client.get(self.list_url, {"search": "Test"})
        self.assertEqual(r.data["count"], 1)

    def test_post_requires_auth_when_configured(self):
        User.objects.create_user("writer", password="pass")
        r = self.client.post(self.list_url, {"sku": "X", "title": "Y", "price": "1", "category_id": self.category.id}, format="json")
        # 401/403 if IsAuthenticatedOrReadOnly; 201 if AllowAny
        self.assertIn(r.status_code, (201, 401, 403))
        if r.status_code in (401, 403):
            self.client.force_authenticate(user=User.objects.get(username="writer"))
            r2 = self.client.post(self.list_url, {"sku": "AUTH-1", "title": "Auth", "price": "2", "category_id": self.category.id}, format="json")
            self.assertEqual(r2.status_code, 201)
```

---

## Шаг 4. LocMem cache override (если tests hit redis)

```python
from django.test import override_settings

@override_settings(CACHES={
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
})
class CachedCategoryTest(APITestCase):
    ...
```

---

## Шаг 5. Run

```bash
docker exec mock-django-web python manage.py test api.tests -v 2
docker exec mock-django-web python manage.py test api.tests.test_products.ProductAPITestCase.test_list_returns_200_and_count
```

---

## Coverage (опционально)

```bash
docker exec mock-django-web pip install coverage
docker exec mock-django-web coverage run manage.py test api
docker exec mock-django-web coverage report -m
```

---

## Критерии приёмки

- [ ] ≥8 test methods
- [ ] `manage.py test api.tests` — OK
- [ ] Нет зависимости от порядка tests
- [ ] Runtime suite < 30s на стенде

Далее: [37-testing-advanced](37-testing-advanced.md).
