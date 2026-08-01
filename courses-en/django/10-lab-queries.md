# 10. Lab: ORM queries in the shell

## Goal

Run 8 queries in `manage.py shell` — filter, Q, annotate, select_related.

## Prerequisites

At least 3 Product rows and 2 Category rows in the DB.

---

## Tasks

```python
from django.db.models import Count, Avg, Q
from catalog.models import Product, Category

# 1. active products
Product.objects.filter(is_active=True).count()

# 2. price range
Product.objects.filter(price__gte=20, price__lte=100)

# 3. Q OR
Product.objects.filter(Q(sku__startswith="BOOK") | Q(title__icontains="django"))

# 4. select_related — one SQL query
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

**What you'll see:** query counts via `django.db.connection.queries` if DEBUG is on.

---

## Acceptance criteria

- all commands run without an exception
- you understand the difference between query 4 and the same query without select_related

Next: [11-relationships](11-relationships.md).
