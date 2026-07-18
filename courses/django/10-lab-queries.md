# 10. Лаба: ORM queries в shell

## Цель

Выполнить 8 запросов в `manage.py shell` — filter, Q, annotate, select_related.

## Предварительно

≥3 Product, 2 Category в БД.

---

## Задания

```python
from django.db.models import Count, Avg, Q
from catalog.models import Product, Category

# 1. active products
Product.objects.filter(is_active=True).count()

# 2. price range
Product.objects.filter(price__gte=20, price__lte=100)

# 3. Q OR
Product.objects.filter(Q(sku__startswith="BOOK") | Q(title__icontains="django"))

# 4. select_related — один SQL
list(Product.objects.select_related("category").all()[:5])

# 5. annotate count per category
Category.objects.annotate(n=Count("products")).values("name", "n")

# 6. avg price active
Product.objects.filter(is_active=True).aggregate(avg=Avg("price"))

# 7. explain — Django 4.2+
Product.objects.filter(is_active=True).explain()

# 8. update bulk
Product.objects.filter(stock=0).update(is_active=False)
```

**Что увидите:** query counts via `django.db.connection.queries` if DEBUG.

---

## Критерии

- все команды без exception
- понимаете разницу запросов 4 vs без select_related

Далее: [11-relationships](11-relationships.md).
