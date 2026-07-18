# 06. Лаба: приложение orders

## Цель

Создать app **`orders`** с моделью **Order** (FK на Product), зарегистрировать, мигрировать — локально в стенде через `docker exec`.

## Предварительно

Стенд up, есть Product в catalog ([03-lab-explore-stack](03-lab-explore-stack.md)).

---

## Задание 1. startapp

```bash
docker exec mock-django-web python manage.py startapp orders
```

Скопируйте код на хост для редактирования или правьте через mount (в курсе — правка в [`stack/web`](../../deploy/django/stack/web) + rebuild).

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

## Задание 2. INSTALLED_APPS + migrate

```python
"orders.apps.OrdersConfig",
```

```bash
docker compose up -d --build
docker exec mock-django-web python manage.py makemigrations orders
docker exec mock-django-web python manage.py migrate
```

---

## Задание 3. Admin register

```python
from django.contrib import admin
from orders.models import Order

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "product", "quantity", "user", "created_at")
```

---

## Задание 4. shell create order

```python
from catalog.models import Product
from orders.models import Order
p = Product.objects.first()
Order.objects.create(product=p, quantity=2)
```

---

## Критерии успеха

| # | Критерий |
|---|----------|
| 1 | migrations applied |
| 2 | Order in admin |
| 3 | FK to Product works |

Далее: [07-models-basics](07-models-basics.md).
