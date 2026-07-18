# 05. Apps и структура: bounded context, reusability

## Введение: «один models.py на 4000 строк»

Монолит начинался с `shop/models.py` — через два года там **Order**, **Invoice**, **Blog**, **Webhook**. Migrations конфликтуют, circular imports, admin не найти. **Django app** — unit of reuse и deployment of schema.

## Что вы узнаете

- Когда создавать **новое приложение**.
- **`AppConfig`**, **`default_auto_field`**.
- Layout **catalog vs api** vs **orders**.
- **`apps.py`** и `ready()` hook preview.

---

## Что такое Django app

| App | Содержит |
|-----|----------|
| `models.py` | ORM |
| `views.py` | HTTP logic |
| `admin.py` | ModelAdmin |
| `migrations/` | schema history |
| `tests.py` | unit tests |

App = **Python package** + registration in INSTALLED_APPS.

---

## Bounded context в каталоге

```text
catalog/     # Product, Category — core domain
orders/      # Order, OrderLine — transactional (capstone)
api/         # DRF serializers/viewsets — delivery layer
accounts/    # profile extensions (optional)
```

**api app без models** — только serializers/views — valid pattern.

---

## startapp

```bash
python manage.py startapp orders
```

Добавить в `INSTALLED_APPS`:

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

**Правило:** imports **model → model**, не view → model другого app через циклы.

---

## Reusable apps

Third-party: `rest_framework`, `django_filters`. Свои apps можно вынести в pip package если generic.

---

## Tests per app

```text
catalog/tests/test_models.py
api/tests/test_products_api.py
```

Или `tests/` package — [35-testing-django](35-testing-django.md).

---

## Типичные ошибки

| Ошибка | Последствие |
|--------|-------------|
| God app | unmaintainable migrations |
| api models duplicate catalog | drift |
| Forgot INSTALLED_APPS | AppRegistryNotReady |
| Circular imports | ImportError |

## Резюме

App = граница domain + migrations. catalog + api separation. startapp + AppConfig. Cross-app FK ok with care.

Далее: [06-lab-new-app](06-lab-new-app.md).
