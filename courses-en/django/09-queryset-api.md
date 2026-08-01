# 09. QuerySet API: filter, exclude, Q, F, aggregate

## Introduction

N+1 on a product list — **200 queries** for 100 products. The QuerySet API plus **`select_related`** is Django's baseline optimization.

## What you'll learn

- **filter / exclude / get**.
- **Q objects** for OR.
- **F expressions** for compare fields.
- **aggregate / annotate**.
- **select_related / prefetch_related**.

---

## Basics

```python
Product.objects.filter(is_active=True, price__gte=10)
Product.objects.exclude(category__slug="archived")
Product.objects.get(sku="BOOK-001")  # DoesNotExist / MultipleObjectsReturned
```

| Lookup | Example |
|--------|---------|
| exact | sku="A" |
| iexact | case insensitive |
| contains / icontains | title search |
| gte, lte | price range |
| in | category_id__in=[1,2] |

---

## Q objects

```python
from django.db.models import Q

Product.objects.filter(Q(price__lt=10) | Q(is_active=False))
```

---

## F expressions

```python
from django.db.models import F

Product.objects.filter(stock__lt=F("reorder_level"))  # if field exists
Product.objects.update(price=F("price") * 1.1)  # bulk SQL update
```

---

## select_related vs prefetch_related

| | select_related | prefetch_related |
|---|----------------|------------------|
| SQL | JOIN | 2 queries |
| For | FK, OneToOne | reverse FK, M2M |

```python
Product.objects.select_related("category").filter(is_active=True)
Category.objects.prefetch_related("products").all()
```

---

## aggregate

```python
from django.db.models import Avg, Count, Max

Product.objects.aggregate(avg_price=Avg("price"), total=Count("id"))
```

---

## Lazy evaluation

A QuerySet is **lazy** — it hits the DB on iteration / len / list().

---

## Common mistakes

| Mistake | Fix |
|---------|-----|
| N+1 in loop | select_related |
| get() no row | get_object_or_404 in views |
| filter mutable default | don't use list as default arg |

## Summary

QuerySet is a chainable, lazy SQL builder. Use Q for OR conditions, select_related for FKs, aggregate for reports.

Next: [10-lab-queries](10-lab-queries.md).
