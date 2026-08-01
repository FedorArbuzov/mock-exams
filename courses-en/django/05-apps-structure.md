# 05. Apps and structure: bounded contexts, reusability

## Intro: "one 4000-line models.py"

The monolith started as a single `shop/models.py`. Two years later it holds **Order**, **Invoice**, **Blog**, and **Webhook**. Migrations conflict, imports form circles, and nobody can find anything in the admin. A **Django app** is the unit of reuse and the unit of schema deployment.

## What you'll learn

- When to create a **new app**.
- **`AppConfig`** and **`default_auto_field`**.
- The **catalog vs api vs orders** layout.
- A preview of **`apps.py`** and the `ready()` hook.

---

## What a Django app is

| App | Contains |
|-----|----------|
| `models.py` | ORM |
| `views.py` | HTTP logic |
| `admin.py` | ModelAdmin |
| `migrations/` | schema history |
| `tests.py` | unit tests |

An app is a **Python package** plus a registration entry in INSTALLED_APPS.

---

## Bounded contexts in the catalog

```text
catalog/     # Product, Category — core domain
orders/      # Order, OrderLine — transactional (capstone)
api/         # DRF serializers/viewsets — delivery layer
accounts/    # profile extensions (optional)
```

**An api app with no models** — just serializers/views — is a valid pattern.

---

## startapp

```bash
python manage.py startapp orders
```

Add it to `INSTALLED_APPS`:

```python
INSTALLED_APPS = [
    ...
    "orders.apps.OrdersConfig",
]
```

```python
# orders/apps.py
class OrdersConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "orders"
```

---

## Cross-app imports

```python
# orders/models.py
from catalog.models import Product

class OrderLine(models.Model):
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
```

**Rule:** imports go **model → model**, not view → another app's model through a cycle.

---

## Reusable apps

Third-party examples: `rest_framework`, `django_filters`. Your own apps can be packaged for pip if they're generic enough.

---

## Tests per app

```text
catalog/tests/test_models.py
api/tests/test_products_api.py
```

Or a `tests/` package — see [35-testing-django](35-testing-django.md).

---

## Common mistakes

| Mistake | Consequence |
|--------|-------------|
| A "god" app | unmaintainable migrations |
| api models duplicating catalog | drift |
| Forgot to add to INSTALLED_APPS | AppRegistryNotReady |
| Circular imports | ImportError |

## Summary

An app is a domain boundary plus its migrations. catalog + api separation works well. Use startapp + AppConfig. Cross-app FKs are fine with care.

Next: [06-lab-new-app](06-lab-new-app.md).
