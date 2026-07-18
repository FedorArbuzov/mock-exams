# 09. QuerySet API: filter, exclude, Q, F, aggregate

## Введение

N+1 на списке товаров — **200 queries** на 100 products. QuerySet API + **`select_related`** — базовая оптимизация Django.

## Что вы узнаете

- **filter / exclude / get**.
- **Q objects** для OR.
- **F expressions** для compare fields.
- **aggregate / annotate**.
- **select_related / prefetch_related**.

---

## Basics

```python
Product.objects.filter(is_active=True, price__gte=10)
Product.objects.exclude(category__slug="archived")
Product.objects.get(sku="BOOK-001")  # DoesNotExist / MultipleObjectsReturned
```

| Lookup | Пример |
|--------|--------|
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

QuerySet **lazy** — SQL при iteration / len / list().

---

## Типичные ошибки

| Ошибка | Fix |
|--------|-----|
| N+1 in loop | select_related |
| get() no row | get_object_or_404 in views |
| filter mutable default | don't use list as default arg |

## Резюме

QuerySet — chainable lazy SQL builder. Q for OR. select_related for FK. aggregate for reports.

Далее: [10-lab-queries](10-lab-queries.md).
