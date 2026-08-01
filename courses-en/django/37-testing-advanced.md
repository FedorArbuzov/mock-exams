# 37. Factories, pytest-django, coverage

## Overview

A 50-test suite full of copy-pasted `Category.objects.create` calls is painful to refactor. **Factories**, an optional **pytest-django**, and **coverage** in CI fix that.

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

`baker` fills required fields automatically — less boilerplate.

---

## Explicit factory (no dependencies)

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

Run with `pytest api/` instead of `manage.py test` — same Django, different runner. [`python-testing`](../python-testing/README.md) goes deeper into pytest.

---

## Fixtures vs setUp

| pytest fixture | TestCase setUp |
|----------------|----------------|
| composable | class method |
| `@pytest.fixture` | `def setUp(self)` |

You can mix them: pytest-django alongside APITestCase.

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

- `--keepdb` — don't recreate the test DB between runs (local dev).
- `pytest-xdist` — parallel workers (be careful with shared redis).

---

## Common mistakes

| Mistake | Fix |
|--------|-----|
| Tests hit prod redis | override CACHES |
| Flaky ordering tests | don't rely on PK order without `order_by` |
| bakery duplicate unique | `_fill_optional` or an explicit slug |

---

## Summary

Factories cut down setup code. pytest-django is an optional, more modern runner. `override_settings` isolates cache/auth. Coverage is a metric, not a goal in itself.

Next: [38-docker-gunicorn](38-docker-gunicorn.md).
