# 37. Factories, pytest-django, coverage

## Введение

Suite из 50 tests с copy-paste `Category.objects.create` — боль при refactor. **Factories** + optional **pytest-django** + **coverage** в CI.

---

## Factory pattern (model_bakery)

```bash
pip install model-bakery
```

```python
# catalog/tests/factories.py
from model_bakery import baker

def make_category(**kwargs):
    return baker.make("catalog.Category", **kwargs)

def make_product(**kwargs):
    return baker.make("catalog.Product", **kwargs)
```

```python
def test_product_list_count():
    make_product(_quantity=3)
    assert Product.objects.count() == 3
```

`baker` заполняет обязательные поля автоматически — меньше boilerplate.

---

## Explicit factory (без зависимостей)

```python
def make_category(name="Cat", slug="cat"):
    return Category.objects.create(name=name, slug=slug)

def make_product(category=None, **kwargs):
    category = category or make_category(slug=f"cat-{Product.objects.count()}")
    defaults = {"sku": f"SKU-{Product.objects.count()}", "title": "T", "price": "1.00", "category": category}
    defaults.update(kwargs)
    return Product.objects.create(**defaults)
```

---

## pytest-django

```ini
# pytest.ini
[pytest]
DJANGO_SETTINGS_MODULE = config.settings
python_files = tests.py test_*.py *_tests.py
```

```python
import pytest

@pytest.mark.django_db
def test_category_slug_unique():
    make_category(slug="dup")
    with pytest.raises(Exception):
        make_category(slug="dup")
```

Запуск: `pytest api/` вместо `manage.py test` — тот же Django, другой runner. [`python-testing`](../python-testing/README.md) углубляет pytest.

---

## Fixtures vs setUp

| pytest fixture | TestCase setUp |
|----------------|----------------|
| composable | class method |
| `@pytest.fixture` | `def setUp(self)` |

Можно смешивать: pytest-django + APITestCase.

---

## override_settings

```python
from django.test import override_settings

@override_settings(
    CACHES={"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}},
    REST_FRAMEWORK={"PAGE_SIZE": 5},
)
@pytest.mark.django_db
def test_pagination_page_size(client):
    ...
```

---

## coverage

```bash
pip install coverage
coverage run --source='.' manage.py test api catalog
coverage report -m --skip-covered
coverage html  # htmlcov/
```

CI gate:

```bash
coverage report --fail-under=80
```

---

## Test database speed

- `--keepdb` — не пересоздавать test DB между runs (local dev).
- `pytest-xdist` — parallel workers (осторожно с shared redis).

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| Tests hit prod redis | override CACHES |
| Flaky ordering tests | не полагаться на PK order без `order_by` |
| bakery duplicate unique | `_fill_optional` или явный slug |

---

## Резюме

Factories сокращают setup. pytest-django — optional modern runner. `override_settings` изолирует cache/auth. coverage — метрика, не цель сама по себе.

Далее: [38-docker-gunicorn](38-docker-gunicorn.md).
