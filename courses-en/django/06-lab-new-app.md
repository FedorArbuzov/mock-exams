# 06. Lab: the orders app

## Goal

Create an **`orders`** app with an **Order** model (FK to Product), register it, and migrate — all locally in the stack via `docker exec`.

## Prerequisites

Stack is up, and there's a Product in catalog ([03-lab-explore-stack](03-lab-explore-stack.md)).

---

## Task 1. startapp

```bash
docker exec mock-django-web python manage.py startapp orders
```

Copy the code to the host to edit it, or edit through the mount (in this course, edits go in [`stack/web`](../../deploy/django/stack/web) followed by a rebuild).

`orders/models.py`:

```python
from django.db import models
from django.contrib.auth.models import User
from catalog.models import Product

class Order(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
```

---

## Task 2. INSTALLED_APPS + migrate

```python
"orders.apps.OrdersConfig",
```

```bash
docker compose up -d --build
docker exec mock-django-web python manage.py makemigrations orders
docker exec mock-django-web python manage.py migrate
```

---

## Task 3. Register in Admin

```python
from django.contrib import admin
from orders.models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "quantity", "user", "created_at")
```

---

## Task 4. Create an order in the shell

```python
from catalog.models import Product
from orders.models import Order
p = Product.objects.first()
Order.objects.create(product=p, quantity=2)
```

---

## Success criteria

| # | Criterion |
|---|----------|
| 1 | migrations applied |
| 2 | Order shows up in admin |
| 3 | FK to Product works |

Next: [07-models-basics](07-models-basics.md).
